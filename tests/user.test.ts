jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/__mocks__/authenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { UserUpdateObject } from '@models/UserUpdateObject.js';
import { WrappedBody } from '@models/WrappedBody.js';
import { UserProfileRowSchema } from '@models/UserProfileRow.js';

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

beforeEach(() => {
    /// this is most of them
    setMockedUser("farhad_ebrahimi");
});

describe('User profile Tests', () => {
    const new_user: UserUpdateObject = { user_id: "JoeSchmoe", user_description: "Not applicable" };
    const new_description = "New description for JoeSchmoe";

    describe('GET /userids', () => {
        it('should return a list of user ids', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            const parsedJson = JSON.parse(response.body);
            expect(response.status).toBe(200);
            expect(Array.isArray(parsedJson)).toBe(true);
            expect(parsedJson.length).toBeGreaterThan(0);
            expect(parsedJson.every((id: unknown) => typeof id === 'string')).toBe(true);
            expect(parsedJson).toContain('orbadmin');
            expect(parsedJson).not.toContain(new_user.user_id);
        });
    });

    describe('Requesting information from an existing user', () => {
        it('should return well-formed user data', async () => {
            const response = await request(app)
                .get('/user/orbadmin')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            UserProfileRowSchema.parse(parsedJson);
        });
    });


    describe('Requesting information from a new user', () => {
        it('should return similarly well-formed data', async () => {
            const response = await request(app)
                .get(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            UserProfileRowSchema.parse(parsedJson);
        });
    });

    describe('GET /userids now includes the new user', () => {
        it('should return a list of user ids', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toContain(new_user.user_id);
        });
    });

    describe('Requesting information from the aforementioned new user', () => {
        it('should return well-formed data', async () => {
            const response = await request(app)
                .get(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            UserProfileRowSchema.parse(parsedJson);
        });
    });


    describe('Updating the user description', () => {
        it('cannot be done by non-self/non-admin', async () => {
            const newData: WrappedBody<UserUpdateObject> = {
                body: { user_id: new_user.user_id, user_description: new_description },
                hash: "the backend doesn't care about the hash"
            };
            const response = await request(app)
                .put(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(newData);

            expect(response.status).toBe(400);
        });
    });

    describe('Updating the user description', () => {
        it('can be done by self (non-admin)', async () => {
            const newData: WrappedBody<UserUpdateObject> = {
                body: { user_id: 'farhad_ebrahimi', user_description: 'I will not bother to track this' },
                hash: "the backend doesn't care about the hash"
            };
            const response = await request(app)
                .put(`/user/farhad_ebrahimi`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send(newData);

            expect(response.status).toBe(200);
        });
    });

    describe('Updating the user description', () => {
        it('should be no problem', async () => {
            setMockedUser("orbadmin");
            const newData: WrappedBody<UserUpdateObject> = {
                body: { user_id: new_user.user_id, user_description: new_description },
                hash: "the backend doesn't care about the hash"
            };
            const response = await request(app)
                .put(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"))
                .send(newData);

            expect(response.status).toBe(200);
        });
    });

    describe('Requesting information from the aforementioned new user', () => {
        it('now returns the updated data', async () => {
            const response = await request(app)
                .get(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            UserProfileRowSchema.parse(parsedJson);
            expect(parsedJson.user_description).toBe(new_description);
        });
    });

    describe('Deleting the new user', () => {
        it('should be impossible for a normal user', async () => {
            const response = await request(app)
                .delete(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(403);
        });
    });

    describe('Deleting the new user', () => {
        it('should succeed for orbadmin', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .delete(`/user/${new_user.user_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));

            expect(response.status).toBe(200);
        });
    });

    describe('GET /userids', () => {
        it('should now not include the new user', async () => {
            const response = await request(app)
                .get('/userids')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).not.toContain(new_user.user_id);
        });
    });

});