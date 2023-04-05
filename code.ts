const debug = true;
const debugLog = (message: any) => debug ? console.log(`plugin script: ${message}`) : null; 

debugLog("start");

figma.showUI(__html__, { width: 200, height: 200 });
// import * as Airtable from "./node_modules/airtable/lib/airtable";
// const AirtableBase = new Airtable({apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN}).base('appCrmeg3nF3WOVFr')

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

//@ts-ignore
let upsertToTable: Function | null = null

function sendUiError(msg: any) {
  figma.ui.postMessage({
    pluginMessage: {
      type: "error",
      data: msg,
    },
  });
}

function sendUiMessage(msg: string) {
  figma.ui.postMessage({
    pluginMessage: {
      type: "message",
      data: msg,
    },
  });
}

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
  
      // Syncing
      //  - on node chage
      //  - upsert to airtable
      await initialUpsert(upsertToTable);
      figma.ui.postMessage("sync complete");
      break;
    case 'initialize':
      await initialize();  
      break;
    default:
      break;
  }
};
// On Error
//  - send error to ui
//  - stop syncing

// End Sync


// watches changes and upserts changed nodes
figma.on("documentchange", (event) => {
  debugLog(event.documentChanges)
  event.documentChanges
    .map((r) => [r.id, r.type])
    .forEach(([id, key]) => {
      switch (key) {
        case 'PROPERTY_CHANGE':
          // get node by id
          const node = figma.getNodeById(id);
          // upsert
          
          break;
        
        case 'DELETE':
          // delete record by id
          break;
        // case 'CREATE':
        // create is always followed by a property change
        //   break;
        default:
          break;
      }
      console.log("document change");
    });
});

function getNodeById(id: string) {
  return figma.getNodeById(id);
}




async function initialUpsert(upsert: Function) {
  let nodes: SceneNode[] = [];
  const allNodes: SceneNode[] = [];

  debugLog("getting nodes")
  nodes = figma.currentPage.children.map((n) => n);
  getAllChildNodes(nodes, allNodes);

  const recordData = allNodes.map((n) => ({
    fields: {
      figma_id: n.id,
      name: n.name,
      type: n.type,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
    },
  }));

  // airtable batch requests are limited to 10 records per request
  // create a batch of 10 records
  debugLog("creating batches");
  const batches = [];
  let i, j, tempBatch;
  for (i = 0, j = recordData.length; i < j; i += 10) {
    tempBatch = recordData.slice(i, i + 10);
    batches.push(tempBatch);
  }
  // create a batch request for each batch of records
  for (let k = 0; k < batches.length; k++) {
    const batchData = {
      // airtable allows an upsert operation
      performUpsert: {
        fieldsToMergeOn: ["figma_id"],
      },
      records: batches[k],
    };
    await upsert(batchData)
  }

  debugLog("end of initialization");
}

// return a function that accepts a an array of records
function upsert(pat: string, baseId: string, tableId: string){
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const headers = {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
  return async function(batchData: any){
    debugLog('upserting to table')
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(batchData),
      });
      if(!response.ok){
        throw new Error(response.statusText)
      }
      sendUiMessage(`${batchData.records.length} records upserted`)
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