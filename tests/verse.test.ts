jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/MockUser.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { WrappedBody } from '@models/WrappedBody.js';
import { Verse } from '@models/Verse.js';
import { VerseReference } from '@models/VerseReference.js';
import { VerseReferenceJsonSchema } from '@models/VerseReferenceJson.js';
import { GetHebrewVerseResponseSchema, GetNTVerseResponseSchema } from '@models/VerseResponse.js';
import { GlossSendObject } from '@models/GlossSendObject.js';
import { UpdateVerseData } from '@models/UpdateVerseData.js';
import { createTestProject, deleteTestProject } from './mockProject.js';

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

describe('Verse Endpoints Tests', () => {

    describe('GET /verse/:project_id/:reference', () => {

        it('should return well-formed Greek data (NT JHN 1:25)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/NT JHN 1:25`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
        });

        it('should return well-formed Greek data (NT JHN 1:26)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/NT JHN 1:26`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
        });

        it('should return well-formed Greek data (NT JHN 8:1)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/NT JHN 8:1`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const verse = GetNTVerseResponseSchema.parse(parsedJson);
            expect(verse.words.length).toBeGreaterThan(0);
            // console.log("verse", verse);
        });

        it('should return well-formed Hebrew data (OT GEN 1:8)', async () => {
            const ref = VerseReference.fromString("OT GEN 1:8")!;
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetHebrewVerseResponseSchema.parse(parsedJson);
        });


        it('should return 400 for a nonce NT reference (NT XYZ 1:25)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/NT XYZ 1:25`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(400);
        });

        it('should return 400 for a nonce OT reference (OT PDQ 1:8)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/OT PDQ 1:8`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(400);
        });


        it('should return 400 for an out of bounds OT reference (OT PSA 160:1)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/OT PSA 160:1`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(400);
        });


    });

    describe('Greek POST /verse/:project_id/:reference', () => {
        const ref = VerseReference.fromString("NT JHN 1:25")!;
        let verseBeforeChanges: Verse | undefined;
        const index = 16;
        let lex_id = -1;
        let word_id = -1;

        it('should start off without votes in Elias for JHN 1:25', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            verseBeforeChanges = Verse.fromNTVerseResponse(ref, parsedJson);
            /// Elias is the 0-indexed 16th word in the verse
            expect(verseBeforeChanges?.words[index].text).toBe("Ἠλίας");
            expect(verseBeforeChanges?.words[index].elements.length).toBe(1);
            expect(verseBeforeChanges?.words[index].elements[0].glossSuggestions.length).toBe(0);
            word_id = verseBeforeChanges?.words[index].elements[0].word_id;
            lex_id = verseBeforeChanges?.words[index]!.elements[0].lex_id;
        });

        it('and then receive a new gloss for Elijah', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "Elijah" }, gloss_id: -1, voice: "NA" }, // -1 means new gloss
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

        it('which should then have said gloss (JHN 1:25)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
            /// Elias is the 0-indexed 16th word in the verse
            expect(verse.words[index].text).toBe("Ἠλίας"); /// sanity check
            expect(verse.words[index].elements.length).toBe(1);
            expect(verse.words[index].elements[0].glossSuggestions.length).toBe(1);
            expect(verse.words[index].elements[0].glossSuggestions[0].html).toBe("Elijah");
            expect(verse.words[index].elements[0].glossSuggestions[0].votes).toBe(1);
        });

    });

    describe('GET /verse/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity, starting from NT JHN 1:25', () => {
        it('should return JHN 1:23 for the previous verse', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/30/NT JHN 1:25/before/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT JHN 1:23");
        });

        it('should return JHN 1:27 for the following verse', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/30/NT JHN 1:25/after/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT JHN 1:27");
        });

        it('should return NT JHN 7:13 for the next verse (after me)', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get(`/verse/farsi/30/NT JHN 7:12/after/me`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            /// this will at least be true until the PAW is updated
            expect(ref?.toString()).toBe("NT JHN 8:1");
        });

    });

    describe('GET /verse/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity, starting from OT JON 2:8', () => {
        it('should return JON 2:7', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/50/OT JON 2:8/before/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("OT JON 2:7");
        });

        it('should return JON 2:10 for the following verse', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/50/OT JON 2:8/after/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("OT JON 2:10");
        });
    });


    describe('GET /verse/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity, with nonce reference NT XYZ 2:8', () => {
        it('should return code 400', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/50/NT XYZ 2:8/before/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(400);
        });

    });


    describe('GET /verse/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity; from JHN 6:3 in Farsi as Farhad', () => {
        it('first should receive a new gloss for anerchomai', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "شششششش" }, gloss_id: -1, voice: "active" }, // -1 means new gloss
                votes: ["farhad_ebrahimi"],
                location: { word_id: 552726, lex_id: 503679 },
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
                .post(`/verse/farsi/NT JHN 6:3`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(200);
        });

        it('which should then have said gloss (NT JHN 6:3)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farsi/NT JHN 6:3`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);

            const ref = VerseReference.fromString('NT JHN 6:3');
            if (!ref) { throw new Error("ref is undefined"); }
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
            /// Elias is the 0-indexed 16th word in the verse
            const index = 0;
            expect(verse.words[index].text).toBe("ἀνῆλθεν"); /// sanity check
            expect(verse.words[0].elements[0].glossSuggestions.some((suggestion) => suggestion.html === "شششششش")).toBe(true);
        });

        describe('Seeking as Farhad in farsi, starting from JHN 6:1 ', () => {
            it('for after (me), it should be JHN 6:4', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farsi/30/NT JHN 6:1/after/me`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                VerseReferenceJsonSchema.parse(parsedJson);
                const ref = VerseReference.fromJson(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT JHN 6:4");
            });

            it('for after (anyone), it should be JHN 10:5', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farsi/30/NT JHN 6:1/after/anyone`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                VerseReferenceJsonSchema.parse(parsedJson);
                const ref = VerseReference.fromJson(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT JHN 8:1");
            });

            it('for before (me), it should be JHN 5:47', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farsi/30/NT JHN 6:1/before/me`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                VerseReferenceJsonSchema.parse(parsedJson);
                const ref = VerseReference.fromJson(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT JHN 5:47");
            });

            it('for before (anyone), it should be LUK 24:51', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farsi/30/NT JHN 6:1/before/anyone`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                VerseReferenceJsonSchema.parse(parsedJson);
                const ref = VerseReference.fromJson(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT LUK 24:51");
            });

        });

    });

    describe('Seeking for a verse at the edge of the canon should return the first verse of the canon', () => {

        it('from the beginning of the OT', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get(`/verse/bhsa/50/OT GEN 1:2/before/me`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("OT GEN 1:1");
        });

        it('from the beginning of the NT', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get(`/verse/sblgnt-biblebento/30/NT MAT 1:2/before/me`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT MAT 1:1");
        });

        it('from the end of the OT', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get(`/verse/bhsa/50/OT MAL 1:1/after/me`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("OT MAL 3:24");
        });

        it('from the end of the NT', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get(`/verse/sblgnt-biblebento/30/NT REV 1:1/after/me`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            VerseReferenceJsonSchema.parse(parsedJson);
            const ref = VerseReference.fromJson(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT REV 22:21");
        });


    });

});