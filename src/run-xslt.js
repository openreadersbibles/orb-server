// const fs = require('fs');
// const saxonJs = require('saxon-js');
import SaxonJS from 'saxon-js';
import fs from 'fs';
import tei2html from './xslt/tei2html.sef.js';
import dumb from './xslt/dump.sef.js';

// Load the XML input
const xml = fs.readFileSync('bhsa_OT_JON.xml', 'utf8');

// Run the transformation
const result = SaxonJS.transform({
    stylesheetInternal: dumb,
    sourceText: xml,
    destination: 'application', // Capture multiple outputs
    stylesheetParams: { "filenamebase": "mybase" },
    sourceBaseURI: "file:///C:/Users/Adam/Documents/open-readers-bibles/application/orb-server/src/",
});

console.log("here at least")
console.log(result)

// Collect the results
// if (result.secondaryResult) {
//     for (const [fileName, fileContent] of Object.entries(result.secondaryResult)) {
//         console.log(`File: ${fileName}`);
//         console.log(`Content: ${fileContent}`);
//     }
// } else {
//     console.log('No secondary results found.');
// }


// Output the result
// console.info(result.principalResult);