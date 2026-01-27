import { VerseReference } from '@models/VerseReference.js';

describe('Verse Reference Tests', () => {

    describe('Verse reference OT GEN 1:8', () => {
        it('can be produced from string', async () => {
            const str = "OT GEN 1:8";
            const ref = VerseReference.fromString(str);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe(str);
        });
    });

    describe('Verse reference NT JHN 1:25', () => {
        it('can be produced from string', async () => {
            const str = "NT JHN 1:25";
            const ref = VerseReference.fromString(str);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe(str);
        });
    });

    describe('Verse reference NT JHN 1:26', () => {
        it('can be produced from string', async () => {
            const str = "NT JHN 1:26";
            const ref = VerseReference.fromString(str);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe(str);
        });
    });

    describe('Nonce verse reference NT XYZ 1:25', () => {
        it('should produce undefined object', async () => {
            const str = "NT XYZ 1:25";
            const ref = VerseReference.fromString(str);
            expect(ref).toBe(undefined);
        });
    });

    describe('Nonce verse reference OT PDQ 1:8', () => {
        it('should produce undefined object', async () => {
            const str = "OT PDQ 1:8";
            const ref = VerseReference.fromString(str);
            expect(ref).toBe(undefined);
        });
    });

    describe('Out-of-range verse reference NT GAL 7:5', () => {
        it('should produce undefined object', async () => {
            const str = "NT GAL 7:5";
            const ref = VerseReference.fromString(str);
            expect(ref).toBe(undefined);
        });
    });

    describe('Out-of-range verse reference OT PSA 160:1', () => {
        it('should produce undefined object', async () => {
            const str = "OT PSA 160:1";
            const ref = VerseReference.fromString(str);
            expect(ref).toBe(undefined);
        });
    });

});