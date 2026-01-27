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
import { GetNTVerseResponseSchema } from '@models/VerseResponse.js';
import { GlossSendObject } from '@models/GlossSendObject.js';
import { UpdateVerseData } from '@models/UpdateVerseData.js';
import { PhraseGlossLocation } from '@models/gloss-locations.js';
import { MarkdownAnnotationContent } from '@models/AnnotationJsonObject.js';
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

describe('Phrase Gloss Endpoints Tests', () => {
    let gloss_id = -999;
    const md = "This is a *very* silly example of a phrase.";
    /// refers to words in JHN 10:5
    /// verify: select * from nt where _id=556644
    const location = new PhraseGlossLocation(556644, 556647);

    describe('POST /verse/:project_id/:reference (NT JHN 10:5)', () => {
        const ref = VerseReference.fromString("NT JHN 10:5")!;

        it('should accept a new gloss', async () => {
            setMockedUser("farhad_ebrahimi");
            const gso: GlossSendObject = {
                annotationObject: { type: "markdown", content: { markdown: md }, gloss_id: -1, voice: "NA" }, // -1 means new gloss
                votes: ["farhad_ebrahimi"],
                location: location.toObject(),
            }
            const verseUpdate: UpdateVerseData = {
                word_gloss_updates: [],
                phrase_gloss_updates: [gso],
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

        it('which should then have said phrase gloss (NT JHN 10:5)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/verse/test_project/${ref.toString()}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            GetNTVerseResponseSchema.parse(parsedJson);
            const verse = Verse.fromNTVerseResponse(ref, parsedJson);

            const pg = verse.phraseGlosses.filter((pg) => (pg.location as PhraseGlossLocation).from === location.from).at(0);
            expect(pg).not.toBe(undefined);
            expect(pg?.annotation.toAnnotationObject().type).toBe("markdown");
            const a = pg?.annotation.toAnnotationObject().content as MarkdownAnnotationContent;
            expect(a.markdown).toBe(md);
            if (pg?.gloss_id) {
                gloss_id = pg?.gloss_id;
            }
        });

        it('which cannot be edited by a regular user', async () => {
            setMockedUser("orbadmin");

            const gso: GlossSendObject = {
                annotationObject: { type: "markdown", content: { markdown: "SILLY EDITED WILL NOT WORK" }, gloss_id: gloss_id, voice: "NA" },
                votes: ["farhad_ebrahimi"],
                location: location.toObject(),
            }
            const wb: WrappedBody<GlossSendObject> = {
                body: gso,
                hash: "dummy_hash",
            };

            const response = await request(app)
                .put(`/phrasegloss`)
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

            const pg = verse.phraseGlosses.filter((pg) => (pg.location as PhraseGlossLocation).from === location.from).at(0);
            expect(pg).not.toBe(undefined);
            expect(pg?.annotation.toAnnotationObject().type).toBe("markdown");
            const a = pg?.annotation.toAnnotationObject().content as MarkdownAnnotationContent;
            expect(a.markdown).toBe(md);
        });

        it('which can be edited by a power user', async () => {
            setMockedUser("farhad_ebrahimi");

            const gso: GlossSendObject = {
                annotationObject: { type: "markdown", content: { markdown: "EDITED MARKDOWN" }, gloss_id: gloss_id, voice: "NA" },
                votes: ["farhad_ebrahimi"],
                location: location.toObject(),
            }
            const wb: WrappedBody<GlossSendObject> = {
                body: gso,
                hash: "dummy_hash",
            };

            const response = await request(app)
                .put(`/phrasegloss`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"))
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

            const pg = verse.phraseGlosses.filter((pg) => (pg.location as PhraseGlossLocation).from === location.from).at(0);
            expect(pg).not.toBe(undefined);
            expect(pg?.annotation.toAnnotationObject().type).toBe("markdown");
            const a = pg?.annotation.toAnnotationObject().content as MarkdownAnnotationContent;
            expect(a.markdown).toBe("EDITED MARKDOWN");
        });

        it('which cannot be deleted by a regular user', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .delete(`/phrasegloss/${gloss_id}`)
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

            const pg = verse.phraseGlosses.filter((pg) => (pg.location as PhraseGlossLocation).from === location.from).at(0);
            expect(pg).not.toBe(undefined);
            expect(pg?.annotation.toAnnotationObject().type).toBe("markdown");
            const a = pg?.annotation.toAnnotationObject().content as MarkdownAnnotationContent;
            expect(a.markdown).toBe("EDITED MARKDOWN");
        });

        it('which can be deleted by a power user', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .delete(`/phrasegloss/${gloss_id}`)
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
            const pg = verse.phraseGlosses.filter((pg) => (pg.location as PhraseGlossLocation).from === location.from).at(0);
            expect(pg).toBe(undefined);
        });

    });

});