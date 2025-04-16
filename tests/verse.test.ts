import '../src/mockAuthenticate.js';
import { setMockedUser } from '../src/mockAuthenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { WrappedBody } from '@models/SavedPostRequest.js';
import { ProjectConfigurationRow } from '@models/ProjectConfiguration.js';
import { GetHebrewVerseResponseSchema, GetNTVerseResponseSchema } from './type-guards/VerseSchema.js';
import { Verse } from '@models/Verse.js';
import { VerseReference } from '@models/VerseReference.js';
import { GlossSendObject, UpdateVerseData } from '@models/database-input-output.js';

let server: Server;

beforeAll((done) => {
    server = app.listen(() => {
        done();
    });
});

afterAll((done) => {
    server.close(() => {
        done();
    });
});

describe('Project Endpoints Tests', () => {
    const newProjectData: ProjectConfigurationRow = {
        project_id: "test_project",
        project_title: "Test Project",
        project_description: "A test project description",
        layout_direction: "ltr",
        frequency_thresholds: { OT: 50, NT: 30 },
        bookNames: { Genesis: "Genesis", Exodus: "Exodus" },
        canons: ["OT", "NT"],
        roles: [{ user_id: "farhad_ebrahimi", user_role: "admin", power_user: 1 }],
        allow_joins: true,
        font_families: "Arial",
        font_size: 12,
        parsing_formats: {},
        publication_configurations: {},
        numerals: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    };

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

    describe('PUT /project', () => {
        it('should create a new project', async () => {
            setMockedUser("farhad_ebrahimi");
            const wb: WrappedBody<ProjectConfigurationRow> = {
                body: newProjectData,
                hash: "dummy_hash",
            };

            const response = await request(app)
                .put(`/project`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"))
                .send(wb);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toBe(true);
        });
    });

    describe('GET /verse/:user_id/:project_id/:reference (OT GEN 1:8)', () => {
        it('should return well-formed Hebrew data', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/OT GEN 1:8`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetHebrewVerseResponseSchema.parse(parsedJson);
        });

    });

    describe('GET /verse/:user_id/:project_id/:reference', () => {

        it('should return well-formed Greek data (NT JHN 1:25)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/NT JHN 1:25`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
        });

        it('should return well-formed Greek data (NT JHN 1:26)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/NT JHN 1:26`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
        });

        // Pericope of the Adulterous Woman — not sure what the correct behavior is yet
        // it('should return well-formed Greek data (NT JHN 8:1)', async () => {
        //     setMockedUser("farhad_ebrahimi");
        //     const response = await request(app)
        //         .get(`/verse/farhad_ebrahimi/test_project/NT JHN 8:1`)
        //         .set('Content-Type', 'application/json')
        //         .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

        //     expect(response.status).toBe(200);
        //     const parsedJson = JSON.parse(response.body);
        //     const verse = GetNTVerseResponseSchema.parse(parsedJson);
        //     expect(verse.words.length).toBeGreaterThan(0);
        //     console.log("verse", verse);
        // });

        it('should return well-formed Hebrew data (OT GEN 1:8)', async () => {
            const ref = VerseReference.fromString("OT GEN 1:8")!;
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetHebrewVerseResponseSchema.parse(parsedJson);
        });


        it('should return 400 for a nonce NT reference (NT XYZ 1:25)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/NT XYZ 1:25`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(400);
        });

        it('should return 400 for a nonce OT reference (OT PDQ 1:8)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/OT PDQ 1:8`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(400);
        });


        it('should return 400 for an out of bounds OT reference (OT PSA 160:1)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/OT PSA 160:1`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(400);
        });


    });

    describe('Greek POST /verse/:user_id/:project_id/:reference', () => {
        const ref = VerseReference.fromString("NT JHN 1:25")!;
        let verseBeforeChanges: Verse | undefined;
        const index = 16;
        let lex_id = -1;
        let word_id = -1;

        it('should start off without votes in Elias for JHN 1:25', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            verseBeforeChanges = Verse.fromNTVerseResponse(ref, parsedJson);
            /// Elias is the 0-indexed 16th word in the verse
            expect(verseBeforeChanges?.words[index].text).toBe("Ἠλίας");
            expect(verseBeforeChanges?.words[index].elements.length).toBe(1);
            expect(verseBeforeChanges?.words[index].elements[0].myVote).toBe(null);
            expect(verseBeforeChanges?.words[index].elements[0].glossSuggestions.length).toBe(0);
            word_id = verseBeforeChanges?.words[index].elements[0].word_id;
            lex_id = verseBeforeChanges?.words[index]!.elements[0].lex_id;
        });

        it('and then receive a new gloss for Elijah', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "Elijah" } },
                gloss_id: -1, // -1 means new gloss
                myVote: 1,
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
                .post(`/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(200);
        });

        it('which should then have said gloss', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
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
            expect(verse.words[index].elements[0].myVote).toBe(verse.words[index].elements[0].glossSuggestions[0].gloss_id);
        });

        // it('which should then have said gloss', async () => {
        //     console.log("firstGlossId from next it inside", firstGlossId);
        // });

    });

    describe('GET /verse/:user_id/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity, starting from NT JHN 1:25', () => {
        it('should return JHN 1:23 for the previous verse', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/30/NT JHN 1:25/before/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const ref = VerseReference.fromString(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT JHN 1:23");
        });

        it('should return JHN 1:27 for the following verse', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/30/NT JHN 1:25/after/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const ref = VerseReference.fromString(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT JHN 1:27");
        });

        it('should return NT JHN 7:13 for the next verse (after me)', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get(`/verse/orbadmin/farsi/30/NT JHN 7:12/after/me`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const ref = VerseReference.fromString(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("NT JHN 7:13");
        });

    });

    describe('GET /verse/:user_id/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity, starting from OT JON 2:8', () => {
        it('should return JON 2:7', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/50/OT JON 2:8/before/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const ref = VerseReference.fromString(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("OT JON 2:7");
        });

        it('should return JON 2:10 for the following verse', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/50/OT JON 2:8/after/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const ref = VerseReference.fromString(parsedJson);
            expect(ref).not.toBe(undefined);
            expect(ref?.toString()).toBe("OT JON 2:10");
        });
    });


    describe('GET /verse/:user_id/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity, with nonce reference NT XYZ 2:8', () => {
        it('should return code 400', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/test_project/50/NT XYZ 2:8/before/anyone`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(400);
        });

    });


    describe('GET /verse/:user_id/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity; from JHN 6:3 in Farsi as Farhad', () => {
        it('first should receive a new gloss for anerchomai', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "شششششش" } },
                gloss_id: -1, // -1 means new gloss
                myVote: 1,
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
                .post(`/verse/farhad_ebrahimi/farsi/NT JHN 6:3`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(200);
        });

        it('which should then have said gloss', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/farhad_ebrahimi/farsi/NT JHN 6:3`)
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
                    .get(`/verse/farhad_ebrahimi/farsi/30/NT JHN 6:1/after/me`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                const ref = VerseReference.fromString(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT JHN 6:3");
            });

            it('for after (anyone), it should be JHN 10:5', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farhad_ebrahimi/farsi/30/NT JHN 6:1/after/anyone`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                const ref = VerseReference.fromString(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT JHN 10:5");
            });

            it('for before (me), it should be JHN 5:47', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farhad_ebrahimi/farsi/30/NT JHN 6:1/before/me`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                const ref = VerseReference.fromString(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT JHN 5:47");
            });

            it('for before (anyone), it should be LUK 24:51', async () => {
                setMockedUser("farhad_ebrahimi");
                const response = await request(app)
                    .get(`/verse/farhad_ebrahimi/farsi/30/NT JHN 6:1/before/anyone`)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
                expect(response.status).toBe(200);
                const parsedJson = JSON.parse(response.body);
                const ref = VerseReference.fromString(parsedJson);
                expect(ref).not.toBe(undefined);
                expect(ref?.toString()).toBe("NT LUK 24:51");
            });

        });

    });



    describe('DELETE /project/:project_id', () => {
        it('should delete an existing project', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .delete(`/project/${newProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toBe(true);
        });
    });
});