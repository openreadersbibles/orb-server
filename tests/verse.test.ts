/* eslint-disable @typescript-eslint/no-explicit-any */
import '../src/mockAuthenticate.js';
import { setMockedUser } from '../src/mockAuthenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { WrappedBody } from '../../models/SavedPostRequest.js';
import { ProjectConfigurationRow } from '../../models/ProjectConfiguration.js';
import { GetHebrewVerseResponseSchema, GetNTVerseResponseSchema } from './type-guards/VerseSchema.js';
import { Verse } from '../../models/Verse.js';
import { VerseReference } from '../../models/VerseReference.js';
import { GlossSendObject, UpdateVerseData } from '../../models/database-input-output.js';

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

    describe('GET /ot/verse/:user_id/:project_id/:reference', () => {
        it('should return well-formed Hebrew data', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/ot/verse/farhad_ebrahimi/test_project/OT GEN 1:8`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetHebrewVerseResponseSchema.parse(parsedJson);
        });

    });

    describe('GET /nt/verse/:user_id/:project_id/:reference', () => {

        it('should return well-formed Greek data', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/nt/verse/farhad_ebrahimi/test_project/NT JHN 1:25`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
        });

    });

    describe('Hebrew GET /ot/verse/:user_id/:project_id/:reference', () => {
        const ref = VerseReference.fromString("OT GEN 1:8")!;
        it('should return well-formed Hebrew data', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/ot/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetHebrewVerseResponseSchema.parse(parsedJson);
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
                .get(`/nt/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
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

        let firstGlossId = -1;

        it('which should then have said gloss', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/nt/verse/farhad_ebrahimi/test_project/${ref.toString()}`)
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
            firstGlossId = verse.words[index].elements[0].glossSuggestions[0].gloss_id;
            console.log("firstGlossId from inside", firstGlossId);
        });

        // it('which should then have said gloss', async () => {
        //     console.log("firstGlossId from next it inside", firstGlossId);
        // });


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