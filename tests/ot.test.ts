jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { HollowPublicationRequest } from '@models/PublicationRequest.js';
import { WrappedBody } from '@models/WrappedBody.js';
import { setMockedUser } from '../src/__mocks__/authenticate.js';
import { OT } from '@models/Canons.js';

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

describe('OT Publication Tests', () => {

    describe('POST /publish', () => {

        OT.books.forEach((book) => {
            it(`should publish OT ${book}`, async () => {

                setMockedUser("farhad_ebrahimi");

                const req: HollowPublicationRequest = {
                    "books": [
                        {
                            "book": book,
                            "canon": "OT"
                        }
                    ],
                    "project_id": "bhsa",
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
            }, 50000);

        });

        // it('should publish an OT book', async () => {
        //     setMockedUser("farhad_ebrahimi");

        //     const req: HollowPublicationRequest = {
        //         "books": [
        //             {
        //                 "book": "PSA",
        //                 "canon": "OT"
        //             }
        //         ],
        //         "project_id": "bhsa",
        //         "publication_configuration_id": "default",
        //         "nopdf": false
        //     };
        //     const wb: WrappedBody<HollowPublicationRequest> = {
        //         body: req,
        //         hash: "the backend doesn't care about the hash"
        //     };

        //     const response = await request(app)
        //         .post(`/publish`)
        //         .set('Content-Type', 'application/json')
        //         .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
        //         .send(wb);

        //     expect(response.status).toBe(200);
        // }, 50000);

    });

});