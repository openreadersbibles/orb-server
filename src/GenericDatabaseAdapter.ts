import { UpdateVerseData } from "../../models/database-input-output.js";
import { ProjectConfigurationRow, ProjectId } from "../../models/ProjectConfiguration.js";
import { HttpReturnValue } from "../../models/ReturnValue.js";
import { UserId, UserUpdateObject } from "../../models/UserProfile.js";
import { VerseReference } from "../../models/VerseReference.js";

/// See the implementations in SqliteAdapter.ts and MariaDbAdapter.ts

export interface GenericDatabaseAdapter {
    disconnect(): Promise<void>;

    /// Authenticated calls
    getUserData(user_id: UserId): Promise<HttpReturnValue>;
    updateUser(user_id: UserId, userObject: UserUpdateObject): Promise<HttpReturnValue>;
    removeUser(user_id: UserId): Promise<HttpReturnValue>;
    createProject(user_id: UserId, project: ProjectConfigurationRow): Promise<HttpReturnValue>;
    updateProject(user_id: UserId, project: ProjectConfigurationRow): Promise<HttpReturnValue>;
    removeProject(project_id: ProjectId): Promise<HttpReturnValue>;
    updateVerse(user_id: UserId, data: UpdateVerseData, project_id: ProjectId, reference_text: string): Promise<HttpReturnValue>;
    joinProject(user_id: UserId, project_id: ProjectId): Promise<HttpReturnValue>;
    getUserIds(): Promise<HttpReturnValue>;

    /// Non-authenticated calls
    getProjectIdExists(project_id: ProjectId): Promise<HttpReturnValue>;
    getVerse(project_id: ProjectId, user_id: UserId, reference: string): Promise<HttpReturnValue>;
    seekVerse(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after", exclusivity: "me" | "anyone"): Promise<HttpReturnValue>;
    getProjectDescriptions(): Promise<HttpReturnValue>;
}