const fs = require('fs');
const saxonJs = require('saxon-js');

// Load the XML input
const xml = fs.readFileSync('bhsa_OT_JON.xml', 'utf8');

// Run the transformation
const result = saxonJs.transform({
    stylesheetFileName: './tei2html.sef.json',
    sourceText: xml,
    destination: 'serialized'
});

// Output the result
console.info(result.principalResult);