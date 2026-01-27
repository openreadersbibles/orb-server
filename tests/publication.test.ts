jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/MockUser.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { HollowPublicationRequest } from '@models/PublicationRequest.js';
import { CheckResultsSchema } from '@models/database-input-output.js';
import { UbsBook } from '@models/UbsBook.js';
import { WrappedBody } from '@models/WrappedBody.js';
import { console } from 'inspector';
import { setVote } from './setVote.js';

let server: Server;

beforeAll((done) => {
    server = app.listen(async () => {
        done();
    });
});

afterAll((done) => {
    server.close(async () => {
        done();
    });
});

describe('Publication Endpoints Tests', () => {

    describe('POST /check', () => {
        it('should return an empty array for Farsi Jonah', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "JON",
                        "canon": "OT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const results = CheckResultsSchema.parse(parsedJson);
            expect(results).toBeDefined();
            expect(results).toHaveProperty('OT JON');
            expect(results['OT JON']).toEqual([]);
        });

        it('should return a ten-element array for Farsi Isaiah', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "ISA",
                        "canon": "OT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const results = CheckResultsSchema.parse(parsedJson);
            expect(results).toBeDefined();
            expect(results).toHaveProperty('OT ISA');
            expect(results['OT ISA']).toEqual(['OT ISA 1:1', 'OT ISA 1:2',
                'OT ISA 1:3', 'OT ISA 1:4',
                'OT ISA 1:5', 'OT ISA 1:6',
                'OT ISA 1:7', 'OT ISA 1:8',
                'OT ISA 1:9', 'OT ISA 1:10']);
        });


        it('should return an empty array for Farsi 1 John', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "1JN",
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const results = CheckResultsSchema.parse(parsedJson);
            expect(results).toBeDefined();
            expect(results).toHaveProperty('NT 1JN');
            expect(results['NT 1JN']).toEqual([]);
        });

        it('should return a ten-element array for Farsi 1 Corinthians', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "1CO",
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const results = CheckResultsSchema.parse(parsedJson);
            expect(results).toBeDefined();
            expect(results).toHaveProperty('NT 1CO');
            expect(results['NT 1CO']).toEqual(['NT 1CO 1:1', 'NT 1CO 1:2',
                'NT 1CO 1:5', 'NT 1CO 1:6',
                'NT 1CO 1:7', 'NT 1CO 1:8',
                'NT 1CO 1:9', 'NT 1CO 1:10',
                'NT 1CO 1:11', 'NT 1CO 1:12']);
        });

        it('should flag 1JN 1:1 when we remove a vote from Farsi 1 John 1:1', async () => {
            setMockedUser("orbadmin");
            setVote('NT 1JN 1:1',
                "orbadmin",
                "farsi",
                { word_id: 624860, lex_id: 501094 },
                { "type": "word", "content": { "gloss": "دیدن" }, gloss_id: 11, voice: "middle" },
                0,
            );

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "1JN",
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const results = CheckResultsSchema.parse(parsedJson);
            expect(results).toBeDefined();
            expect(results).toHaveProperty('NT 1JN');
            expect(results['NT 1JN']).toEqual(['NT 1JN 1:1']);


            setVote('NT 1JN 1:1',
                "orbadmin",
                "farsi",
                { word_id: 624860, lex_id: 501094 },
                { "type": "word", "content": { "gloss": "دیدن" }, gloss_id: 11, voice: "middle" },
                1,
            );

        });


        it('should return an array including 1:1 for Farsi 1 John if we lower the frequency threshold', async () => {
            setMockedUser("farhad_ebrahimi");

            console.error(`Running test`);

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "1JN",
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const results = CheckResultsSchema.parse(parsedJson);
            expect(results).toBeDefined();
            expect(results).toHaveProperty('NT 1JN');
            expect(results['NT 1JN'].length).toEqual(10);
            expect(results['NT 1JN']).toEqual(['NT 1JN 1:6', 'NT 1JN 1:7', 'NT 1JN 1:8', 'NT 1JN 1:9', 'NT 1JN 2:6', 'NT 1JN 2:8', 'NT 1JN 2:9', 'NT 1JN 2:16', 'NT 1JN 2:17', 'NT 1JN 2:22']);
        });

        it('should return a 400 for bad input', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "3CO" as UbsBook,
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };

            const response = await request(app)
                .post(`/check`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(req);

            expect(response.status).toBe(400);
        });

    });


    describe('POST /publish', () => {

        it('should return 200 for Farsi Jonah', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "JON",
                        "canon": "OT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };
            const wb: WrappedBody<HollowPublicationRequest> = {
                body: req,
                hash: "the backend doesn't care about the hash"
            };

            const response = await request(app)
                .post(`/publish`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(200);
            /// the JSON should be AdHocPublicationResult, but that's not really in my control
        });

        // Reconsidering this behavior: It may be more intuitive just to publish it with the blanks.
        it('should return 400 for Farsi Isaiah', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "ISA",
                        "canon": "OT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };
            const wb: WrappedBody<HollowPublicationRequest> = {
                body: req,
                hash: "the backend doesn't care about the hash"
            };

            const response = await request(app)
                .post(`/publish`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(400);
        });


        it('should return 200 for Farsi 1 John', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "1JN",
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };
            const wb: WrappedBody<HollowPublicationRequest> = {
                body: req,
                hash: "the backend doesn't care about the hash"
            };

            const response = await request(app)
                .post(`/publish`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(200);
            /// the JSON should be AdHocPublicationResult, but that's not really in my control
        });

        // Reconsidering this behavior: It may be more intuitive just to publish it with the blanks.
        it('should return 400 for Farsi 1 Corinthians', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "1CO",
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };
            const wb: WrappedBody<HollowPublicationRequest> = {
                body: req,
                hash: "the backend doesn't care about the hash"
            };

            const response = await request(app)
                .post(`/publish`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(400);
        });

        it('should return a 400 for bad input', async () => {
            setMockedUser("farhad_ebrahimi");

            const req: HollowPublicationRequest = {
                "books": [
                    {
                        "book": "3CO" as UbsBook,
                        "canon": "NT"
                    }
                ],
                "project_id": "farsi",
                "publication_configuration_id": "default",
                "nopdf": false
            };
            const wb: WrappedBody<HollowPublicationRequest> = {
                body: req,
                hash: "the backend doesn't care about the hash"
            };

            const response = await request(app)
                .post(`/publish`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(wb);

            expect(response.status).toBe(400);
        });
    });

});