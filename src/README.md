# orb-server

The endpoints are defined in `index.ts`. You can look up the function code from there.

## XSL transformations
XSLT can be done with SaxonJS. 

Installation.
```
npm install saxon-js
```

Compile the XSL files to JSON format:
```
node node_modules/xslt3/xslt3.js -t -xsl:xslt/tei2html.xsl -export:tei2html.sef.json -nogo "-ns:##html5"
node node_modules/xslt3/xslt3.js -t -xsl:xslt/tei2tex.xsl -export:tei2tex.sef.json -nogo "-ns:##html5"
```

Example:
```
node run-xslt.js
```