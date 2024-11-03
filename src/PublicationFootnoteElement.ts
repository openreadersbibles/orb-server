/// This class represents part of the footnote of a publication. 
/// It contains the text of the footnote and the markers that are used to reference it in the publication.
/// Multiple markers are possible, for instance, if two words with the same root occur in the footnote text.

export class PublicationFootnoteElement {
    private _markers = new Array<string>();
    private _text = "";

    constructor(marker: string, text: string) {
        this._markers.push(marker);
        this._text = text;
    }

    get text(): string {
        return this._text;
    }

    public addMarker(marker: string) {
        this._markers.push(marker);
    }

    public markerText(): string {
        return this._markers.join(",");
    }
}