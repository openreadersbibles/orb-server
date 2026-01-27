jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/MockUser.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { WrappedBody } from '@models/WrappedBody.js';
import { VerseReference } from '@models/VerseReference.js';
import { GlossSendObject } from '@models/GlossSendObject.js';
import { UpdateVerseData } from '@models/UpdateVerseData.js';
import { createTestProject, deleteTestProject } from './mockProject.js';
import { getVerse } from './getVerse.js';
import { WordAnnotation } from '@models/Annotation.js';

let server: Server;

beforeAll((done) => {
    server = app.listen(async () => {
        await createTestProject("farhad_ebrahimi");
        done();
    });
});

afterAll((done) => {
    server.close(async () => {
        await deleteTestProject("orbadmin");
        done();
    });
});

describe('Gloss Endpoints Tests', () => {

    let gloss_id = -1;

    describe('POST /verse/:project_id/:reference (NT JHN 10:5)', () => {
        const ref = VerseReference.fromString("NT JHN 10:5")!;
        const lex_id = 503621; /// for ἀλλοτρίῳ
        const word_id = 556641; /// for ἀλλοτρίῳ

        it('should accept a new gloss', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "SILLY EXAMPLE" }, gloss_id: -1, voice: "NA" }, // -1 means new gloss
                votes: ["farhad_ebrahimi"],
                location: { word_id: word_id, lex_id: lex_id },
            }
            const verseUpdate: UpdateVerseData = {
                word_gloss_updates: [gso],
                phrase_gloss_updates: [],
            }
            const wb: WrappedBody<UpdateVerseData> = {
                body: verseUpdate,
                hash: "dummy_hash",
            };
            const response = await request(app)
                .post(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(200);
        });

        it('which should then have said gloss (NT JHN 10:5)', async () => {
            const verse = await getVerse("test_project", ref, "farhad_ebrahimi");

            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(true);
            const farhadsGloss = glosses.find((g) => g.isUsersVote("farhad_ebrahimi"));
            expect(farhadsGloss).not.toBe(undefined);
            expect(farhadsGloss!.html).toBe("SILLY EXAMPLE");
            gloss_id = farhadsGloss!.gloss_id;
            expect(gloss_id).not.toBe(-1);
        });

        it('and ROM 14:4 should now have that gloss as a suggestion', async () => {
            const ref = VerseReference.fromString("NT ROM 14:4")!;
            const verse = await getVerse("test_project", ref, "farhad_ebrahimi");
            const sixthWord = verse.words[5];
            expect(sixthWord.text).toBe("ἀλλότριον"); /// sanity check
            expect(sixthWord.elements[0].glossSuggestions.some((g) => (g.annotation as WordAnnotation).gloss === "SILLY EXAMPLE")).toBe(true);
        });

        it('which cannot be edited by a regular user', async () => {
            setMockedUser("orbadmin");

            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "SILLY EDITED" }, gloss_id: gloss_id, voice: "NA" },
                votes: ["farhad_ebrahimi"],
                location: { word_id: word_id, lex_id: lex_id },
            }
            const wb: WrappedBody<GlossSendObject> = {
                body: gso,
                hash: "dummy_hash",
            };

            const response = await request(app)
                .put(`/gloss`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"))
                .send(wb);
            expect(response.status).toBe(403);
        });

        it('(so that the underlying data will not have changed)', async () => {
            const verse = await getVerse("test_project", ref, "farhad_ebrahimi");

            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(true);
            const farhadsGloss = glosses.find((g) => g.isUsersVote("farhad_ebrahimi"));
            expect(farhadsGloss).not.toBe(undefined);
            expect(farhadsGloss!.html).toBe("SILLY EXAMPLE");
        });

        it('which can be edited by a power user', async () => {
            setMockedUser("farhad_ebrahimi");

            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "SILLY EDITED" }, gloss_id: gloss_id, voice: "NA" },
                votes: ["farhad_ebrahimi"],
                location: { word_id: word_id, lex_id: lex_id },
            }
            const wb: WrappedBody<GlossSendObject> = {
                body: gso,
                hash: "dummy_hash",
            };

            const response = await request(app)
                .put(`/gloss`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);
            expect(response.status).toBe(200);
        });

        it('(so that the underlying data should have changed)', async () => {
            const verse = await getVerse("test_project", ref, "farhad_ebrahimi");

            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            expect(firstWord.text).toBe("ἀλλοτρίῳ"); /// sanity check
            expect(firstWord.elements.length).toBe(1); /// cause it's Greek
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(true);
            const farhadsGloss = glosses.find((g) => g.isUsersVote("farhad_ebrahimi"));
            expect(farhadsGloss).not.toBe(undefined);
            expect(farhadsGloss!.html).toBe("SILLY EDITED");
        });

        it('which cannot be deleted by a regular user', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .delete(`/gloss/${gloss_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(403);
        });

        it('(so that the gloss should still be there)', async () => {
            const verse = await getVerse("test_project", ref, "farhad_ebrahimi");

            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            expect(firstWord.text).toBe("ἀλλοτρίῳ"); /// sanity check
            expect(firstWord.elements.length).toBe(1); /// cause it's Greek
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(true);
            const farhadsGloss = glosses.find((g) => g.isUsersVote("farhad_ebrahimi"));
            expect(farhadsGloss).not.toBe(undefined);
            expect(farhadsGloss!.html).toBe("SILLY EDITED");
        });

        it('which can be deleted by a power user', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .delete(`/gloss/${gloss_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
        });

        it('(so that the gloss should now be gone)', async () => {
            const verse = await getVerse("test_project", ref, "farhad_ebrahimi");

            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            expect(firstWord.text).toBe("ἀλλοτρίῳ"); /// sanity check
            expect(firstWord.elements.length).toBe(1); /// cause it's Greek
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(false);
        });

    });

});