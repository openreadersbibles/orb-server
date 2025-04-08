import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';

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

describe('Authorization Tests', () => {
    describe('Requests with wrong authorization tokens', () => {
        it('should return a 401 unauthorized code', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'NOT_A_REAL_AUTHORIZATION_TOKEN');

            expect(response.status).toBe(401);
        });
    });

    describe('Requests with no authorization token', () => {
        it('should return a 401 unauthorized code', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(401);
        });
    });

    describe('Requests with the admin token', () => {
        it('should return a 200 unauthorized code', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));
            expect(response.status).toBe(200);
        });
    });

    describe('Requests with a regular user token token', () => {
        it('should return a 200 unauthorized code', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));
            expect(response.status).toBe(200);
        });
    });

});
