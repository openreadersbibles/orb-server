import { Annotation } from "../../models/Annotation";
import { VerseReference } from "../../models/VerseReference";
import { PublicationFootnoteType } from "./PublicationFootnote";
import { PublicationPhrasalGloss } from "./PublicationPhrasalGloss";

export interface PublicationWordElement {
    plaintext: string;
    lexicalform: string;
    trailer: string; /// this will admittedly only be relevant for Hebrew/Aramaic
    requiredFootnoteType(ref: VerseReference): PublicationFootnoteType;
    get isVerb(): boolean;
    get isSubstantive(): boolean;
    get isInteroggative(): boolean; // only relevant to Hebrew/Aramaic?
    gloss: Annotation | null;
    getParsingString(ref: VerseReference): string;
    get ketivQereString(): string; // only relevant for Hebrew/Aramaic
    get terminatesWord(): boolean;
    phrasalGlosses: PublicationPhrasalGloss[];
    get id(): number;
}