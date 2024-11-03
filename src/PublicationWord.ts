import { VerseReference } from "../../models/VerseReference";
import { PublicationFootnoteType } from "./PublicationFootnote";
import { PublicationPhrasalGloss } from "./PublicationPhrasalGloss";
import { PublicationWordElement } from "./PublicationWordElement";

export class PublicationWord {
    public elements = new Array<PublicationWordElement>();
    private ref: VerseReference;

    constructor(ref: VerseReference) {
        this.ref = ref;
    }

    addElement(e: PublicationWordElement) {
        this.elements.push(e);
    }

    getText() {
        return this.elements.map(e => e.plaintext).join('');
    }

    getSeparator(): string {
        return this.elements[this.elements.length - 1].trailer;
    }

    public glossableElements(): PublicationWordElement[] {
        return this.elements.filter((value: PublicationWordElement) => { return value.requiredFootnoteType(this.ref) != PublicationFootnoteType.None; });
    }

    public getNumberOfGlosses(): number {
        return this.glossableElements().length;
    }

    public getPhrasalGlosses(): PublicationPhrasalGloss[] {
        let glosses = new Array<PublicationPhrasalGloss>();
        this.glossableElements().forEach((element) => {
            glosses = glosses.concat(element.phrasalGlosses);
        });
        return glosses;
    }

    public hasWordId(id: number): boolean {
        return this.elements.some((element) => element.id == id);
    }

}