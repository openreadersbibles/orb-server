import { GitHubFile } from "./GitHubAdapter";
import * as fs from 'fs';
import * as path from 'path';

const saxonJs = require('saxon-js');
const tei2htmlPathFromWebpack = require('./tei2html.sef.json');
const tei2texPathFromWebpack = require('./tei2tex.sef.json');

export class XslTransformations {
    static tei2html: any;
    static tei2tex: any;

    // Load the JSON files synchronously
    static initialize() {
        const tei2htmlPath = path.resolve(__dirname, tei2htmlPathFromWebpack);
        const tei2texPath = path.resolve(__dirname, tei2texPathFromWebpack);

        this.tei2html = fs.readFileSync(tei2htmlPath, 'utf8');
        this.tei2tex = fs.readFileSync(tei2texPath, 'utf8');
    }

    static produceTransformedFiles(files: GitHubFile[]): GitHubFile[] {
        let htmlFiles = files
            .filter(file => file.path.endsWith('.xml'))
            .map(file => XslTransformations.produceHtmlForFile(file));
        let texFiles = files
            .filter(file => file.path.endsWith('.xml'))
            .map(file => XslTransformations.produceTeXForFile(file));
        return htmlFiles.concat(texFiles);
    }

    static produceHtmlForFile(file: GitHubFile): GitHubFile {
        const newPath = file.path.replace('.xml', '.html');
        const newContent = XslTransformations.xslTransform(file.content, this.tei2html);
        return { path: newPath, content: newContent };
    }

    static produceTeXForFile(file: GitHubFile): GitHubFile {
        const newPath = file.path.replace('.xml', '.tex');
        const newContent = XslTransformations.xslTransform(file.content, this.tei2tex);
        return { path: newPath, content: newContent };
    }

    static xslTransform(fileContent: string, stylesheetContent: string): string {
        return saxonJs.transform({
            stylesheetText: stylesheetContent,
            sourceText: fileContent,
            destination: 'serialized'
        });
    }

}

// Initialize the JSON files
XslTransformations.initialize();