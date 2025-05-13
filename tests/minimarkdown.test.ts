import { MiniMarkdown } from '@models/MiniMarkdown.js';

const converter = new MiniMarkdown();

describe('Mini Markdown Tests', () => {

    describe('Italics', () => {
        it('are rendered with <i>', async () => {
            const input = "this is *very* important";
            const output = converter.makeHtml(input);
            expect(output).toBe("this is <i>very</i> important");
        });

        it('are rendered with <i>', async () => {
            const input = "*very* important";
            const output = converter.makeHtml(input);
            expect(output).toBe("<i>very</i> important");
        });

        it('are rendered with <i>', async () => {
            const input = "this is *important*";
            const output = converter.makeHtml(input);
            expect(output).toBe("this is <i>important</i>");
        });
    });

    describe('Unspecified source language', () => {
        it('are rendered with <span class="original-language">', async () => {
            const input = "this is [[very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="original-language">very</span> important`);
        });

        it('are rendered with <span class="original-language">', async () => {
            const input = "this is [[very]]";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="original-language">very</span>`);
        });

        it('are rendered with <span class="original-language">', async () => {
            const input = "[[very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`<span class="original-language">very</span> important`);
        });
    });

    describe('Hebrew source language', () => {
        it('are rendered with <span class="hebrew">', async () => {
            const input = "this is [[hebrew|very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="hebrew">very</span> important`);
        });

        it('are rendered with <span class="hebrew">', async () => {
            const input = "this is [[hebrew|very]]";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="hebrew">very</span>`);
        });

        it('are rendered with <span class="hebrew">', async () => {
            const input = "[[hebrew|very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`<span class="hebrew">very</span> important`);
        });
    });

    describe('Greek source language', () => {
        it('are rendered with <span class="greek">', async () => {
            const input = "this is [[greek|very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="greek">very</span> important`);
        });

        it('are rendered with <span class="greek">', async () => {
            const input = "this is [[greek|very]]";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="greek">very</span>`);
        });

        it('are rendered with <span class="greek">', async () => {
            const input = "[[greek|very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`<span class="greek">very</span> important`);
        });
    });

    describe('Arbitrary source language', () => {
        it('are rendered with <span class="arbitrary">', async () => {
            const input = "this is [[arbitrary|very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="arbitrary">very</span> important`);
        });

        it('are rendered with <span class="arbitrary">', async () => {
            const input = "this is [[arbitrary|very]]";
            const output = converter.makeHtml(input);
            expect(output).toBe(`this is <span class="arbitrary">very</span>`);
        });

        it('are rendered with <span class="arbitrary">', async () => {
            const input = "[[arbitrary|very]] important";
            const output = converter.makeHtml(input);
            expect(output).toBe(`<span class="arbitrary">very</span> important`);
        });
    });

    describe('Combined tags', () => {
        it('are rendered correctly', async () => {
            const input = "the meaning is *very* uncertain. It resembles the Hebrew word [[חזה]] but in the LXX it's [[greek|ὅρασις]].";
            const output = converter.makeHtml(input);
            expect(output).toBe(`the meaning is <i>very</i> uncertain. It resembles the Hebrew word <span class="original-language">חזה</span> but in the LXX it's <span class="greek">ὅρασις</span>.`);
        });

        it('are rendered correctly', async () => {
            const input = "*highlighted* [[greek|ὅρασις]].";
            const output = converter.makeHtml(input);
            expect(output).toBe(`<i>highlighted</i> <span class="greek">ὅρασις</span>.`);
        });
    });

});