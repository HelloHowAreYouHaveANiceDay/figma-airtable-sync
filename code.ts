console.log("SCRIPT BEGINS");
// RESET TOKEN
const AIRTABLE_PERSONAL_ACCESS_TOKEN =
  "patX3r2kZAeZ3RVsv.2b403ecb6cac0a9be0d04b3933583a7573d8f7b411b66be77ad71bd5a9059cbd";
const baseId = "appCrmeg3nF3WOVFr";
const tableName = "Nodes";
const headers = {
  Authorization: `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

figma.showUI(__html__);

// import * as Airtable from "./node_modules/airtable/lib/airtable";
// const AirtableBase = new Airtable({apiKey: AIRTABLE_PERSONAL_ACCESS_TOKEN}).base('appCrmeg3nF3WOVFr')

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).
console.log("START");

figma.ui.onmessage = async (msg) => {
  console.log('passed', msg);
  figma.ui.postMessage({
    pluginMessage: 'Hello Response'
  });
}

// Figma Airtable Sync




// async function script() {
//   let nodes: SceneNode[] = [];
//   // Define a recursive function to get all child nodes
//   function getAllChildNodes(nodes: SceneNode[], result: SceneNode[]) {
//     // Iterate over all nodes in the array
//     nodes.forEach((node) => {
//       // Add the current node to the result array
//       result.push(node);

//       // If the current node is a container (e.g. a frame or group), recurse on its children
//       //@ts-ignore
//       if (node.children) {
//         //@ts-ignore
//         getAllChildNodes(node.children, result);
//       }
//     });
//   }

//   debugger;

//   // Get the currently active page
//   const currentPage = figma.currentPage;

//   nodes = figma.currentPage.children.map((n) => n); // Replace with your own array of SceneNodes
//   const allNodes: SceneNode[] = [];
//   getAllChildNodes(nodes, allNodes);
//   console.log(
//     allNodes.map((n) => ({
//       id: n.id,
//       name: n.name,
//     }))
//   );

//   const recordData = allNodes.map((n) => ({
//     fields: {
//       figma_id: n.id,
//       name: n.name,
//     },
//   }));

//   const batches = [];
//   let i, j, tempBatch;
//   for (i = 0, j = recordData.length; i < j; i += 10) {
//     tempBatch = recordData.slice(i, i + 10);
//     batches.push(tempBatch);
//   }
//   // create a batch request for each batch of records
//   for (let k = 0; k < batches.length; k++) {
//     const batchData = {
//       "records": batches[k]
//     };
//     const createUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
//     const createResponse = await fetch(createUrl, {
//       method: 'POST',
//       headers: headers,
//       body: JSON.stringify(batchData)
//     });
//     const createData = await createResponse.json();
//     console.log(createData);
//   }

//   // Log the names of all frames in the page
//   // frames.forEach(frame => console.log(frame.name + '' + frame.type));

//   console.log("END");
//   // figma.currentPage.selection = nodes;
//   // figma.viewport.scrollAndZoomIntoView(nodes);

//   // Make sure to close the plugin when you're done. Otherwise the plugin will
//   // keep running, which shows the cancel button at the bottom of the screen.
//   figma.closePlugin();
// }

// script();
console.log("END");