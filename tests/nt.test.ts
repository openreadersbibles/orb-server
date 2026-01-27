jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { HollowPublicationRequest } from '@models/PublicationRequest.js';
import { WrappedBody } from '@models/WrappedBody.js';
import { setMockedUser } from '../src/MockUser.js';
import { NT } from '@models/Canons.js';
import { UbsBook } from '@models/UbsBook.js';

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

describe('NT Publication Tests', () => {

    describe('POST /publish', () => {

        // NT.books.forEach((book) => {
        ['3JN' as UbsBook].forEach((book) => {
            it(`should publish NT ${book}`, async () => {

                setMockedUser("farhad_ebrahimi");

                const req: HollowPublicationRequest = {
                    "books": [
                        {
                            "book": book,
                            "canon": "NT"
                        }
                    ],
                    "project_id": "sblgnt-biblebento",
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

        // it('should publish an NT book', async () => {
        //     setMockedUser("farhad_ebrahimi");

        //     const req: HollowPublicationRequest = {
        //         "books": [
        //             {
        //                 "book": "JHN",
        //                 "canon": "NT"
        //             }
        //         ],
        //         "project_id": "sblgnt-biblebento",
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
        // }, 500000);

    });

});