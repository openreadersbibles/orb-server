import { PublicationFootnote } from "./PublicationFootnote";
import { PublicationWord } from "./PublicationWord";
import { VerseReference } from "../../models/VerseReference";
import { PublicationRequest } from "../../models/PublicationRequest";
import { PublicationWordElement } from "./PublicationWordElement";
import { PublicationHebrewWordElementRow } from "./PublicationHebrewWordElementRow";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { PublicationPhrasalGloss } from "./PublicationPhrasalGloss";

export type WordElementCreator = (obj: any, word: PublicationWord, request: PublicationRequest) => PublicationWordElement;

export class PublicationVerse {
    public reference: VerseReference;
    public request: PublicationRequest;
    protected _elements = new Array<PublicationWordElement>();
    public words = new Array<PublicationWord>();

    constructor(reference: VerseReference, request: PublicationRequest) {
        this.reference = reference;
        this.request = request;
    }

    public text(): string {
        // return this.verseText() + this.footnoteText();
        /// put the footnote first so it stays with the front of the verse at least
        return this.footnoteText() + this.verseText();
    }

    private verseText(): string {
        let text = "";
        let glossCounter = 0;
        let finalPhrasalGlossMarkers = new Map<number, string[]>();

        /// typeset the verse number (in the main text)
        text += `\\MainTextVerseMark{${this.reference.chapter}}{${this.reference.verse}}`;

        this.words.forEach((word) => {
            const pgs = word.getPhrasalGlosses();

            /// add in the initial markers of any phrasal glosses
            /// note that placing these here assumes that phrasal glosses will have lower
            /// marker numbers than simple gloss footnotes (which is visually intuitive)
            pgs.filter((pg) => word.hasWordId(pg.from_word_id)).forEach((pg) => {
                let marker = this.request.project.getFootnoteMarker(glossCounter);
                text += `\\MainTextFootnoteMark{${marker}}`;
                /// keep track of these; we'll add the final markers later
                if (!finalPhrasalGlossMarkers.has(pg.to_word_id)) {
                    finalPhrasalGlossMarkers.set(pg.to_word_id, []);
                }
                finalPhrasalGlossMarkers.get(pg.to_word_id)?.push(marker);
                glossCounter++;
            });

            /// add the text of the word
            text += word.getText();

            /// if there is only one gloss, add a footnote marker
            const gc = word.getNumberOfGlosses();
            if (gc == 1) {
                text += `\\MainTextFootnoteMark{${this.request.project.getFootnoteMarker(glossCounter)}}`;
                glossCounter++;
            } else if (gc > 1) {
                console.error("More than one gloss for a word:");
                console.error(word);
            }

            /// add in the final markers of any phrasal glosses
            for (let [word_id, markers] of finalPhrasalGlossMarkers.entries()) {
                if (word.hasWordId(word_id)) {
                    markers.forEach((marker) => {
                        text += `\\MainTextFootnoteMark{${marker}}`;
                    });
                }
            }

            text += word.getSeparator();
        });
        return text;
    }

    private footnoteText(): string {
        const fn = new PublicationFootnote(this, this.request.project);
        return fn.text();
    }

    public verseXml(parent: XMLBuilder): void {
        let glossCounter = 0;
        const phrasalGlosses = this.getPhrasalGlosses();

        this.words.forEach((word) => {
            const pgs = word.getPhrasalGlosses();

            let localParent = parent;

            /// add any phrasal glosses in at the beginning of the span
            pgs.filter((pg) => word.hasWordId(pg.from_word_id)).forEach((pg) => {
                const marker = this.request.project.getFootnoteMarker(glossCounter);
                glossCounter++;

                parent.ele('span', {
                    from: `#id${pg.from_word_id}`,
                    to: `#id${pg.to_word_id}`,
                    n: marker
                }).txt(pg.markdown);
            });

            /// we want to add the <w> element if it's either a from- or a to- word
            const needsTag = phrasalGlosses.some((pg) => word.hasWordId(pg.from_word_id) || word.hasWordId(pg.to_word_id));
            if (needsTag) {
                localParent = parent.ele('w').att('xml:id', `id${String(word.elements[0].id)}`);
            }
            /// add the text of the word
            localParent.txt(word.getText());

            /// if there is only one gloss, add a footnote marker
            const gc = word.getNumberOfGlosses();
            if (gc == 1) {
                // text += `<note type="gloss" n="${this.request.project.getFootnoteMarker(glossCounter)}">dummy</note>`;
                const note_node = parent.ele('note', { type: 'gloss', n: this.request.project.getFootnoteMarker(glossCounter) });
                PublicationFootnote.xml(this, word.glossableElements()[0], note_node);

                glossCounter++;
            } else if (gc > 1) {
                console.error("More than one gloss for a word:");
                console.error(word);
            }

            parent.txt(word.getSeparator());

        });
    }

    private getPhrasalGlosses(): PublicationPhrasalGloss[] {
        let glosses = new Array<PublicationPhrasalGloss>();
        this.elements.forEach((element) => {
            glosses = glosses.concat(element.phrasalGlosses);
        });
        return glosses;
    }

    private getXmlIdForWordElement(wordElement: PublicationWordElement): string {
        return `${this.reference.xmlId}-${this.elements.indexOf(wordElement)}`;
    }

    public get elements(): PublicationWordElement[] {
        return this._elements;
    }

    static fromWordElements(
        rows: any[],
        reference: VerseReference,
        request: PublicationRequest,
        objectCreator: WordElementCreator): PublicationVerse {
        let v = new PublicationVerse(reference, request);

        v.words.push(new PublicationWord(reference));
        for (let i = 0; i < rows.length; i++) {
            const currentWord = v.words[v.words.length - 1];
            const e = objectCreator(rows[i] as PublicationHebrewWordElementRow, currentWord, request);

            v.elements.push(e);
            v.words[v.words.length - 1].addElement(e);

            if (e.terminatesWord && i != rows.length - 1) {
                v.words.push(new PublicationWord(reference));
            }
        }
        return v;
    }

}
