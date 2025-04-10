import { GitHubFile } from "./GitHubAdapter.js";
import { PublicationConfiguration } from "../../models/PublicationConfiguration.js";
import SaxonJS from 'saxon-js';

import tei2htmlPathFromWebpack from './tei2html.sef.json';
import tei2texPathFromWebpack from './tei2tex.sef.json';

export class XslTransformations {

    static produceTransformedFiles(files: GitHubFile[], configuration: PublicationConfiguration): GitHubFile[] {
        const htmlFiles = files
            .filter(file => file.path.endsWith('.xml'))
            .map(file => XslTransformations.produceHtmlForFile(file, configuration));
        const texFiles = files
            .filter(file => file.path.endsWith('.xml'))
            .map(file => XslTransformations.produceTeXForFile(file, configuration));
        return htmlFiles.concat(texFiles);
    }

    static produceHtmlForFile(file: GitHubFile, configuration: PublicationConfiguration): GitHubFile {
        const newPath = configuration.id + '/' + file.path.replace('.xml', '.html');
        const newContent = XslTransformations.xslTransform(file.content, tei2htmlPathFromWebpack);
        return { path: newPath, content: newContent };
    }

    static produceTeXForFile(file: GitHubFile, configuration: PublicationConfiguration): GitHubFile {
        const newPath = configuration.id + '/' + file.path.replace('.xml', '.tex');
        const newContent = XslTransformations.xslTransform(file.content, tei2texPathFromWebpack);

        if (file.pb === undefined) {
            throw new Error("File does not have a PublicationBook object.");
        }

        let biblicalFontCommand = "";
        if (file.pb.canon == "OT") {
            biblicalFontCommand = `\\newfontfamily\\hebrewfont[Script=Hebrew]{${configuration.publicationBiblicalFont}}`;
        } else {
            biblicalFontCommand = `\\newfontfamily\\greekfont[Script=Greek]{${configuration.publicationBiblicalFont}}`;
        }

        const withLaTeXTemplate = configuration.latex_template
            .replace(/__CONTENT__/g, newContent)
            .replace(/__TITLE__/g, file.pb.book_title)
            .replace(/__BIBLICALLANGUAGE__/g, file.pb.canon == "OT" ? "hebrew" : "greek")
            .replace(/__MAINLANGUAGEFONT__/g, configuration.publicationProjectFont)
            .replace(/__MAINLANGUAGE__/g, configuration.polyglossiaOtherLanguage)
            .replace(/__NEWFONTFAMILYCOMMAND__/g, biblicalFontCommand)
            .replace(/__FOOTNOTESTYLE__/g, configuration.footnote_style);

        return { path: newPath, content: withLaTeXTemplate };
    }

    static xslTransform(fileContent: string, stylesheetContent: object): string {
        return SaxonJS.transform({
            stylesheetInternal: stylesheetContent,
            sourceText: fileContent,
            destination: 'serialized'
        }).principalResult || '';
    }

}
