import { GitHubFile } from "./GitHubAdapter.js";
import { PublicationConfiguration } from "../../models/PublicationConfiguration.js";
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
        const newContent = XslTransformations.xslTransform(file, tei2html);
        console.log(newContent);
        const transformedFiles: GitHubFile[] = [];
        for (const key of Object.keys(newContent)) {
            transformedFiles.push({ path: key, content: newContent[key] });
        }
        return transformedFiles;
    }

    static produceTeXForFile(file: GitHubFile, configuration: PublicationConfiguration): GitHubFile[] {
        const newContent = XslTransformations.xslTransform(file, tei2tex);
        console.log(newContent);

        if (file.pb === undefined) {
            throw new Error("File does not have a PublicationBook object.");
        }

        let biblicalFontCommand = "";
        if (file.pb.canon == "OT") {
            biblicalFontCommand = `\\newfontfamily\\hebrewfont[Script=Hebrew]{${configuration.publicationBiblicalFont}}`;
        } else {
            biblicalFontCommand = `\\newfontfamily\\greekfont[Script=Greek]{${configuration.publicationBiblicalFont}}`;
        }

        const transformedFiles: GitHubFile[] = [];
        for (const key of Object.keys(newContent)) {
            const withLaTeXTemplate = configuration.latex_template
                .replace(/__CONTENT__/g, newContent[key])
                .replace(/__TITLE__/g, file.pb.book_title)
                .replace(/__BIBLICALLANGUAGE__/g, file.pb.canon == "OT" ? "hebrew" : "greek")
                .replace(/__MAINLANGUAGEFONT__/g, configuration.publicationProjectFont)
                .replace(/__MAINLANGUAGE__/g, configuration.polyglossiaOtherLanguage)
                .replace(/__NEWFONTFAMILYCOMMAND__/g, biblicalFontCommand)
                .replace(/__FOOTNOTESTYLE__/g, configuration.footnote_style);
            transformedFiles.push({ path: key, content: withLaTeXTemplate });
        }
        return transformedFiles;
    }

    static xslTransform(file: GitHubFile, stylesheetContent: object): { [key: string]: string } {
        const filenamebase = file.path.replace(/\.[^/.]+$/, ''); // Remove the file extension
        const result = SaxonJS.transform({
            stylesheetInternal: stylesheetContent,
            sourceText: file.content,
            destination: 'serialized', // Use 'application' to capture multiple outputs
            params: { "filenamebase": filenamebase }
        });
        console.log("XSLT transformation result:", result);

        // Check if secondary results exist
        if (result.secondaryResult) {
            return result.secondaryResult; // Return all secondary outputs as an object
        }

        // Fallback to the principal result if no secondary results exist
        return { principal: result.principalResult || '' };
    }

}
