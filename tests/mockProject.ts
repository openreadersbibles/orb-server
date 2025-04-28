jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/__mocks__/authenticate.js';

import { ProjectConfigurationRow } from "@models/ProjectConfigurationRow";
import { WrappedBody } from "@models/WrappedBody";
import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from "./acccessTokenFromJson";

export const testProjectData: ProjectConfigurationRow = {
    project_id: "test_project",
    project_title: "Test Project",
    project_description: "A test project description",
    layout_direction: "ltr",
    frequency_thresholds: { OT: 50, NT: 30 },
    bookNames: { Genesis: "Genesis", Exodus: "Exodus" },
    canons: ["OT", "NT"],
    roles: [{ user_id: "farhad_ebrahimi", user_role: "admin", power_user: 1 }, { user_id: "orbadmin", user_role: "member", power_user: 0 }],
    allow_joins: true,
    font_families: "Arial",
    font_size: 12,
    parsing_formats: {},
    publication_configurations: {},
    numerals: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
};

export async function createTestProject(as_user: string) {
    setMockedUser(as_user);
    const wb: WrappedBody<ProjectConfigurationRow> = {
        body: testProjectData,
        hash: "dummy_hash",
    };

    await request(app)
        .put(`/project`)
        .set('Content-Type', 'application/json')
        .set('Authorization', accessTokenFromJson(as_user))
        .send(wb);
}

export async function deleteTestProject(as_user: string) {
    setMockedUser(as_user);
    await request(app)
        .delete(`/project/${testProjectData.project_id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', accessTokenFromJson(as_user));

}
