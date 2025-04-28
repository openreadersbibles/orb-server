jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/__mocks__/authenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { HollowPublicationRequest } from '@models/PublicationRequest.js';
import { CheckResultsSchema } from '@models/database-input-output.js';
import { UbsBook } from '@models/UbsBook.js';
import { WrappedBody } from '@models/WrappedBody.js';

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