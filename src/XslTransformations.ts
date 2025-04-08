import { GitHubFile } from "./GitHubAdapter.js";
import * as fs from 'fs';
import * as path from 'path';
import { PublicationConfiguration } from "../../models/PublicationConfiguration.js";

const saxonJs = require('saxon-js');
const tei2htmlPathFromWebpack = require('./tei2html.sef.json');
const tei2texPathFromWebpack = require('./tei2tex.sef.json');

export class XslTransformations {
    static tei2html: any;
    static tei2tex: any;

    // Load the JSON files synchronously
    static initialize() {
        if (fs.existsSync('./tei2html.sef.json') && fs.existsSync('./tei2tex.sef.json')) {
            this.tei2html = fs.readFileSync('./tei2html.sef.json', 'utf8');
            this.tei2tex = fs.readFileSync('./tei2tex.sef.json', 'utf8');
        } else {
            const tei2htmlPath = path.resolve(__dirname, tei2htmlPathFromWebpack);
            const tei2texPath = path.resolve(__dirname, tei2texPathFromWebpack);
            this.tei2html = fs.readFileSync(tei2htmlPath, 'utf8');
            this.tei2tex = fs.readFileSync(tei2texPath, 'utf8');
        }
    }

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
        const newContent = XslTransformations.xslTransform(file.content, this.tei2html);
        return { path: newPath, content: newContent };
    }

    static produceTeXForFile(file: GitHubFile, configuration: PublicationConfiguration): GitHubFile {
        const newPath = configuration.id + '/' + file.path.replace('.xml', '.tex');
        const newContent = XslTransformations.xslTransform(file.content, this.tei2tex);

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

    static xslTransform(fileContent: string, stylesheetContent: string): string {
        return saxonJs.transform({
            stylesheetText: stylesheetContent,
            sourceText: fileContent,
            destination: 'serialized'
        }).principalResult || '';
    }

}

// Initialize the JSON files
XslTransformations.initialize();