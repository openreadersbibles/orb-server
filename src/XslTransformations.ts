import { GitHubFile } from "./GitHubAdapter";

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
        const newContent = XslTransformations.xslTransform(file.content, './tei2html.sef.json');
        return { path: newPath, content: newContent };
    }

    static produceTeXForFile(file: GitHubFile): GitHubFile {
        const newPath = file.path.replace('.xml', '.tex');
        const newContent = XslTransformations.xslTransform(file.content, './tei2tex.sef.json');
        return { path: newPath, content: newContent };
    }

    static xslTransform(fileContent: string, stylesheetPath: string): string {
        const saxonJs = require('saxon-js');
        const sef = require(stylesheetPath);

        return saxonJs.transform({
            stylesheetText: sef,
            sourceText: fileContent,
            destination: 'serialized'
        });
    }

}
