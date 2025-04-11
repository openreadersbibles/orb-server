/* eslint-disable @typescript-eslint/no-explicit-any */
import '../src/mockAuthenticate.js';
import { setMockedUser } from '../src/mockAuthenticate.js';

import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from './acccessTokenFromJson.js';
import { Server } from 'http';
import { WrappedBody } from '../../models/SavedPostRequest.js';
import { ProjectConfigurationRow, ProjectDescription } from '../../models/ProjectConfiguration.js';
import { ProjectDescriptionSchema } from './type-guards/ProjectConfigurationRowSchema.js';
import { UserProfile, UserProfileRow } from '../../models/UserProfile.js';

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
    const testUserId = "test_user";
    // const new_user: UserUpdateObject = { user_id: "JoeSchmoe", user_description: "Not applicable" };
    const newProjectData: ProjectConfigurationRow = {
        project_id: "test_project",
        project_title: "Test Project",
        project_description: "A test project description",
        layout_direction: "ltr",
        frequency_thresholds: { OT: 50, NT: 30 },
        bookNames: { Genesis: "Genesis", Exodus: "Exodus" },
        canons: ["OT", "NT"],
        roles: [{ user_id: testUserId, user_role: "admin", power_user: 1 }],
        allow_joins: true,
        font_families: "Arial",
        font_size: 12,
        parsing_formats: {},
        publication_configurations: {},
        numerals: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    };
    const unjoinableProjectData: ProjectConfigurationRow = {
        project_id: "unjoinable_project",
        project_title: "Unjoinable Project",
        project_description: "A project that cannot be joined",
        layout_direction: "ltr",
        frequency_thresholds: { OT: 50, NT: 30 },
        bookNames: { Genesis: "Genesis", Exodus: "Exodus" },
        canons: ["OT", "NT"],
        roles: [{ user_id: testUserId, user_role: "admin", power_user: 1 }],
        allow_joins: false,
        font_families: "Arial",
        font_size: 12,
        parsing_formats: {},
        publication_configurations: {},
        numerals: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    };

    describe('GET /projectExists/:project_id', () => {
        it('should return false if the project does not exist', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/projectExists/nonexistent_project`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toBe(false);
        });

        it('should return true if the project exists', async () => {
            setMockedUser("orbadmin");
            // Create the project first
            const response = await request(app)
                .get(`/projectExists/bhsa`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toBe(true);
        });
    });

    describe('PUT /project', () => {
        it('should create a new project', async () => {
            setMockedUser("orbadmin");
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


    describe('POST /joinproject/:project_id', () => {
        it('should allow a user to join a project', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .post(`/joinproject/${newProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"))
                .send({
                    body: {},
                    hash: "dummy_hash",
                });

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toBe(true);
        });

        it('results in that user getting the project data', async () => {
            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .get(`/user/farhad_ebrahimi`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            const user = new UserProfile(parsedJson as UserProfileRow);
            expect(user.project(newProjectData.project_id)).toBeDefined();
        });

        it('is not possible when a project is unjoinable', async () => {
            /// create the project with test_user as admin
            setMockedUser("test_user");
            const wb: WrappedBody<ProjectConfigurationRow> = {
                body: unjoinableProjectData,
                hash: "dummy_hash",
            };
            await request(app)
                .put(`/project`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("test_user"))
                .send(wb);

            setMockedUser("farhad_ebrahimi");
            const response = await request(app)
                .post(`/joinproject/${unjoinableProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("farhad_ebrahimi"));

            expect(response.status).toBe(403);

            /// remove the project
            setMockedUser("orbadmin");
            await request(app)
                .delete(`/project/${unjoinableProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("test_user"));
        });
    });

    describe('PUT /project/:project_id', () => {
        it('should not work if user is not a project admin', async () => {
            setMockedUser("orbadmin");
            const updatedProjectData = { ...newProjectData, project_title: "Updated Test Project" };

            const response = await request(app)
                .put(`/project/${newProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"))
                .send({
                    body: updatedProjectData,
                    hash: "dummy_hash",
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /project/:project_id', () => {
        it('should update an existing project', async () => {
            setMockedUser("test_user");
            const updatedProjectData = { ...newProjectData, project_title: "Updated Test Project" };
            const response = await request(app)
                .put(`/project/${newProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("test_user"))
                .send({
                    body: updatedProjectData,
                    hash: "dummy_hash",
                });

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);
            expect(parsedJson).toBe(true);
        });
    });

    describe('DELETE /project/:project_id', () => {
        it('should not be allowed for non-orbadmin', async () => {
            setMockedUser("test_user");
            const response = await request(app)
                .delete(`/project/${newProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("test_user"));

            expect(response.status).toBe(403);
        });

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

        it('can fail silently if a project does not exist', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .delete(`/project/${unjoinableProjectData.project_id}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("test_user"));

            expect(response.status).toBe(200);
        });

        /// remove the project
    });

    describe('GET /projectdescriptions', () => {
        it('should return a list of project descriptions', async () => {
            setMockedUser("orbadmin");
            const response = await request(app)
                .get('/projectdescriptions')
                .set('Content-Type', 'application/json')
                .set('Authorization', accessTokenFromJson("orbadmin"));

            expect(response.status).toBe(200);
            const parsedJson = JSON.parse(response.body);

            expect(Array.isArray(parsedJson)).toBe(true);
            expect(parsedJson.every((item: any) => ProjectDescriptionSchema.parse(item))).toBe(true);
            expect(parsedJson.some((project: ProjectDescription) => project.project_id === "bhsa")).toBe(true);
        });
    });

});