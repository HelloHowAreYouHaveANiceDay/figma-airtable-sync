
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).


// shitty debug logging
const debug = false;
const debugLog = (message: any) => debug ? console.log(`plugin script: ${message}`) : null;

debugLog("start");

figma.showUI(__html__, { width: 200, height: 200 });

let upsertToTable: Function
let isSyncing: boolean = false;

/**
 * Posts an error to the ui
 * 
 * @param msg - message to send to ui
 */
function sendUiError(msg: any) {
  figma.ui.postMessage({
    pluginMessage: {
      type: "error",
      data: msg,
    },
  });
}

/**
 * Posts a message to the ui
 * 
 * @param msg - message to send to ui
 */
function sendUiMessage(msg: string) {
  figma.ui.postMessage({
    pluginMessage: {
      type: "message",
      data: msg,
    },
  });
}

/**
 * Store airtable credentials in client storage
 * 
 * @param pat - personal access token
 * @param baseId - base id
 * @param tableId - table id
 */
const storeCredentials = async (pat: string, baseId: string, tableId: string,) => {
  try {
    await figma.clientStorage.setAsync("AIRTABLE_CREDENTIALS", {
      pat,
      baseId,
      tableId,
    });
    debugLog('stored credentials successfully')
    sendUiMessage('stored airtable credentials')
  } catch (error) {
    debugLog('error storing credentials')
  }
}

/**
 * NOTE: NOT SECURE
 * gets credentials from client storage
 * 
 * @returns credentials from client storage
 */
const getCredentials = async () => {
  try {
    const credentials = await figma.clientStorage.getAsync("AIRTABLE_CREDENTIALS");
    debugLog('got credentials successfully')
    sendUiMessage('got airtable credentials')
    return credentials
  } catch (error) {
    debugLog('error getting credentials')
  }
}


/**
 * NOTE: NOT SECURE
 * On load, get credentials from client storage and send to ui
 */
const initialize = async () => {
  debugLog('initializing')
  const credentials = await getCredentials();
  figma.ui.postMessage({
    pluginMessage: {
      type: "credentials",
      data: credentials,
    },
  });
}

/**
 * Handles messages from the ui. Kicks off plugin functions.
 * 
 * @param msg - message from ui
 */
figma.ui.onmessage = async (msg) => {
  debugLog(msg);

  switch (msg.type) {
    case 'sync':
      console.log(msg);
      await storeCredentials(msg.data.pat, msg.data.baseId, msg.data.tableId);
      upsertToTable = upsert(msg.data.pat, msg.data.baseId, msg.data.tableId);
      // Start Sync
      //  - get all nodes
      //  - upsert to airtable
      await initialUpsert(upsertToTable);

      // Syncing
      //  - on node chage
      isSyncing = true;
      // watches changes and upserts changed nodes
      figma.on("documentchange", upsertOnChange);
      //  - upsert to airtable
      figma.ui.postMessage({
        pluginMessage: {
          type: 'message',
          data: 'syncing with airtable'
        }
      });
      break;
    case 'unsync':
      debugLog('unsyncing')
      isSyncing = false;
      figma.off("documentchange", upsertOnChange);
    case 'initialize':
      await initialize();
      break;
    default:
      break;
  }
};



function upsertOnChange(event: DocumentChangeEvent) {
  debugLog(event.documentChanges)
  if(!isSyncing) return;
  event.documentChanges
    .map((r) => [r.id, r.type])
    .forEach(([id, key]) => {
      switch (key) {
        case 'PROPERTY_CHANGE':
          // get node by id
          const node = figma.currentPage.findOne((n) => n.id === id);
          // upsert
          //@ts-ignore - node should exist if we get a change
          upsertToTable([mapNodeToRecord(node)])
          break;

        case 'DELETE':
          //@ts-ignore
          const withStatus = {
            fields: {
              'figma_id': id,
              'sync_status': 'deleted'
            }
          }
          upsertToTable([withStatus])
          break;
        // case 'CREATE':
        // create is always followed by a property change
        //   break;
        default:
          break;
      }
      console.log("document change");
    });
}


async function initialUpsert(upsert: Function) {
  let nodes: SceneNode[] = [];
  const allNodes: SceneNode[] = [];

  debugLog("getting nodes")
  nodes = figma.currentPage.children.map((n) => n);
  getAllChildNodes(nodes, allNodes);

  const recordData = allNodes.map(mapNodeToRecord);
  upsertToTable(recordData);
  // airtable batch requests are limited to 10 records per request
  // create a batch of 10 records

  // create a batch request for each batch of records


  debugLog("end of initialization");
}

function mapNodeToRecord(node: SceneNode) {
  debugLog(`mapping ${node}`)
  return ({
    fields: {
      figma_id: node.id,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      sync_status: "active",
    }
  })
}

// return a function that accepts a an array of records
function upsert(pat: string, baseId: string, tableId: string) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const headers = {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
  return async function (recordData: any) {
    debugLog('upserting to table')
    try {
      debugLog("creating batches");
      const batches = [];
      let i, j, tempBatch;
      for (i = 0, j = recordData.length; i < j; i += 10) {
        tempBatch = recordData.slice(i, i + 10);
        batches.push(tempBatch);
      }
      for (let k = 0; k < batches.length; k++) {
        const batchData = {
          // airtable allows an upsert operation
          performUpsert: {
            fieldsToMergeOn: ["figma_id"],
          },
          records: batches[k],
        };
        const response = await fetch(url, {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify(batchData),
        });
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        sendUiMessage(`${batchData.records.length} records upserted`)
      }
    } catch (error) {
      sendUiError(error);
    }

  }
}





// Get all child nodes from initial array of nodes
function getAllChildNodes(nodes: SceneNode[], result: SceneNode[]) {
  // Iterate over all nodes in the array
  nodes.forEach((node) => {
    // Add the current node to the result array
    result.push(node);

    // If the current node is a container (e.g. a frame or group), recurse on its children
    //@ts-ignore property 'children' does not exist on type 'SceneNode'
    if (node.children) {
      //@ts-ignore
      getAllChildNodes(node.children, result);
    }
  });
}

debugLog('plugin loaded')