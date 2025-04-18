import '../src/mockAuthenticate.js';
import { setMockedUser } from '../src/mockAuthenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { WrappedBody } from '@models/WrappedBody.js';
import { ProjectConfigurationRow } from '@models/ProjectConfiguration.js';
import { Verse } from '@models/Verse.js';
import { VerseReference } from '@models/VerseReference.js';
import { GetNTVerseResponseSchema } from '@models/VerseResponse.js';
import { GlossSendObject } from '@models/GlossSendObject.js';
import { UpdateVerseData } from '@models/UpdateVerseData.js';

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
        roles: [{ user_id: "farhad_ebrahimi", user_role: "admin", power_user: 1 }, { user_id: "orbadmin", user_role: "member", power_user: 0 }],
        allow_joins: true,
        font_families: "Arial",
        font_size: 12,
        parsing_formats: {},
        publication_configurations: {},
        numerals: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    };

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

    describe('GET /verse/:project_id/:reference', () => {

        it('should return well-formed Greek data (NT JHN 10:5)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/NT JHN 10:5`)
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

    });

    let gloss_id = -1;

    describe('POST /verse/:project_id/:reference (NT JHN 10:5)', () => {
        const ref = VerseReference.fromString("NT JHN 10:5")!;
        const lex_id = 503621; /// for ἀλλοτρίῳ
        const word_id = 556641; /// for ἀλλοτρίῳ

        it('should accept a new gloss', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "SILLY EXAMPLE" }, gloss_id: -1 }, // -1 means new gloss
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
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            expect(firstWord.text).toBe("ἀλλοτρίῳ"); /// sanity check
            expect(firstWord.elements.length).toBe(1); /// cause it's Greek
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(true);
            const farhadsGloss = glosses.find((g) => g.isUsersVote("farhad_ebrahimi"));
            expect(farhadsGloss).not.toBe(undefined);
            expect(farhadsGloss!.html).toBe("SILLY EXAMPLE");
            gloss_id = farhadsGloss!.gloss_id;
            expect(gloss_id).not.toBe(-1);
        });

        it('which cannot be edited by a regular user', async () => {
            setMockedUser("orbadmin");

            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "SILLY EDITED" }, gloss_id: gloss_id },
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
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            expect(firstWord.text).toBe("ἀλλοτρίῳ"); /// sanity check
            expect(firstWord.elements.length).toBe(1); /// cause it's Greek
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(true);
            const farhadsGloss = glosses.find((g) => g.isUsersVote("farhad_ebrahimi"));
            expect(farhadsGloss).not.toBe(undefined);
            expect(farhadsGloss!.html).toBe("SILLY EXAMPLE");
        });

        it('which can be edited by a power user', async () => {
            setMockedUser("farhad_ebrahimi");

            const gso: GlossSendObject = {
                annotationObject: { type: "word", content: { gloss: "SILLY EDITED" }, gloss_id: gloss_id },
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
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
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
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
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
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);
            /// ἀλλοτρίῳ is the 0th word in the verse
            const firstWord = verse.words[0];
            expect(firstWord.text).toBe("ἀλλοτρίῳ"); /// sanity check
            expect(firstWord.elements.length).toBe(1); /// cause it's Greek
            const glosses = firstWord.elements[0].glossSuggestions;
            expect(glosses.some((g) => g.isUsersVote("farhad_ebrahimi"))).toBe(false);
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