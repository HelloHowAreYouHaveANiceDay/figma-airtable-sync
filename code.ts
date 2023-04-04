console.log("SCRIPT BEGINS");


figma.showUI(__html__, { width: 200, height: 200 });

// import * as Airtable from "./node_modules/airtable/lib/airtable";
// const AirtableBase = new Airtable({apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN}).base('appCrmeg3nF3WOVFr')

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).
console.log("START");

figma.ui.onmessage = async (msg) => {
  console.log('passed', msg);
  if (msg.type === 'sync') {
    console.log(msg)
    await script(msg.data.pat, msg.data.baseid, msg.data.tableid);
    figma.ui.postMessage('sync complete')
  }


  figma.ui.postMessage({
    pluginMessage: 'hello from code.ts'
    // getUrl(baseId, tableName)
  });
}

function sendUiError(msg: string) {
  figma.ui.postMessage({
    pluginMessage: {
      type: 'error',
      data: msg
    }
  });
}

function sendUiMessage(msg: string) {
  figma.ui.postMessage({
    pluginMessage: {
      type: 'message',
      data: msg
    }
  });
}



// On Error
//  - send error to ui
//  - stop syncing

// Start Sync
//  - get all nodes
//  - upsert to airtable

// Syncing
//  - on node chage
//  - upsert to airtable

// End Sync

async function script(pat: string, baseId: string, tableId: string) {
  let nodes: SceneNode[] = [];
  const allNodes: SceneNode[] = [];
  
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
        fieldsToMergeOn: ['figma_id']
      },
      "records": batches[k]
    };
    console.log('upserting ' + batchData)
    const headers = {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    };
    const createUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const createResponse = await fetch(createUrl, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(batchData)
    });
    const createData = await createResponse.json();
    console.log(createData);
  }

  console.log("END");

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
}
console.log("END");


// Define a recursive function to get all child nodes
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


// get all records from a table

// get records from a table

// patch records to a table

