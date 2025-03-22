import { GitHubFile } from "./GitHubAdapter";

const saxonJs = require('saxon-js');
const tei2html = require('./tei2html.sef.json');
const tei2tex = require('./tei2tex.sef.json');

export class XslTransformations {

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
        const newContent = XslTransformations.xslTransform(file.content, tei2html);
        return { path: newPath, content: newContent };
    }

    static produceTeXForFile(file: GitHubFile): GitHubFile {
        const newPath = file.path.replace('.xml', '.tex');
        const newContent = XslTransformations.xslTransform(file.content, tei2tex);
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
