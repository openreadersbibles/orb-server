import SaxonJS from 'saxon-js';
import fs from 'fs';
import tei2html from './xslt/tei2html.sef.js';

// Load the XML input
const xml = fs.readFileSync('bhsa_OT_JON.xml', 'utf8');

SaxonJS.transform({
    stylesheetInternal: tei2html,
    sourceText: xml,
    stylesheetParams: { "filenamebase": "mybase" },
    "deliverResultDocument": function (uri) {
        return {
            "destination": "serialized",
            "save": function (resultUri, result, encoding) {
                resultDocs[resultUri] = result;
            }
        };
    }
});

console.log(resultDocs)
