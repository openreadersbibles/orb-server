jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/__mocks__/authenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { StatsSummarySchema } from '@models/StatsSummary.js';

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

describe('Stats Endpoints Tests', () => {

    describe('GET /stats/:project_id/:canon', () => {

        it('should return well-formed data (NT)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/stats/farsi/NT`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const stats = StatsSummarySchema.parse(parsedJson);
            expect(stats).toBeDefined();
        });

        it('should return well-formed data (OT)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/stats/farsi/OT`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const stats = StatsSummarySchema.parse(parsedJson);
            expect(stats).toBeDefined();
        });

        it('should return well-formed data (NT JHN)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/stats/farsi/NT/JHN`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const stats = StatsSummarySchema.parse(parsedJson);
            expect(stats).toBeDefined();
        });

        it('should return well-formed data (OT JON)', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/stats/farsi/OT/JON`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const stats = StatsSummarySchema.parse(parsedJson);
            expect(stats).toBeDefined();
        });

    });

});