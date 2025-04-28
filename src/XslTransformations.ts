import { GitHubFile } from "./GitHubAdapter.js";
import { PublicationConfiguration } from "@models/PublicationConfiguration.js";
import SaxonJS from 'saxon-js';

import tei2tex from './xslt/tei2tex.sef.js';
import tei2html from './xslt/tei2html.sef.js';

export class XslTransformations {

    static produceTransformedFiles(files: GitHubFile[], configuration: PublicationConfiguration): GitHubFile[] {
        const htmlFiles = files
            .filter(file => file.path.endsWith('.xml'))
            .flatMap(file => XslTransformations.produceHtmlForFile(file));
        const texFiles = files
            .filter(file => file.path.endsWith('.xml'))
            .flatMap(file => XslTransformations.produceTeXForFile(file, configuration));
        return htmlFiles.concat(texFiles);
    }

    static produceHtmlForFile(file: GitHubFile): GitHubFile[] {
        const newContent = XslTransformations.xslTransformMultiple(file, tei2html);
        const transformedFiles: GitHubFile[] = [];
        for (const key of Object.keys(newContent)) {
            transformedFiles.push({ path: `${key}`, content: newContent[key] });
        }
        return transformedFiles;
    }

    static produceTeXForFile(file: GitHubFile, configuration: PublicationConfiguration): GitHubFile {
        const newPath = file.path.replace('.xml', '.tex');
        const newContent = XslTransformations.xslTransformSingle(file.content, tei2tex);

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

        return { path: `${newPath}`, content: withLaTeXTemplate };
    }

    static xslTransformMultiple(file: GitHubFile, stylesheetContent: object): { [key: string]: string } {
        const filenamebase = file.path.replace(/\.[^/.]+$/, ''); // Remove the file extension
        const resultDocs: { [key: string]: string } = {}; // Object to store the results
        SaxonJS.transform({
            stylesheetInternal: stylesheetContent,
            sourceText: file.content,
            stylesheetParams: { "filenamebase": filenamebase },
            "deliverResultDocument": function () {
                return {
                    "destination": "serialized",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    "save": function (resultUri: any, result: any) {
                        resultDocs[resultUri] = result;
                    }
                };
            }
        });
        return resultDocs; // Return the object containing all results
    }


    static xslTransformSingle(fileContent: string, stylesheetContent: object): string {
        return SaxonJS.transform({
            stylesheetInternal: stylesheetContent,
            sourceText: fileContent,
            destination: 'serialized'
        }).principalResult || '';
    }

}
