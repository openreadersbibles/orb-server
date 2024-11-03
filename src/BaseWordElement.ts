import { PublicationRequest } from "../../models/PublicationRequest";
import { PublicationWord } from "./PublicationWord";

export class BaseWordElement {
    request: PublicationRequest;
    word: PublicationWord;

    constructor(word: PublicationWord, request: PublicationRequest) {
        this.word = word;
        this.request = request;
    }

}