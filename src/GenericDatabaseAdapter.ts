import { ProjectPackage, UpdateVerseData } from "../../models/database-input-output";
import { ProjectId } from "../../models/ProjectConfiguration";
import { IReturnValue } from "../../models/ReturnValue";
import { UserId, UserUpdateObject } from "../../models/UserProfile";
import { VerseReference } from "../../models/VerseReference";

/// See the implementations in SqliteAdapter.ts and MariaDbAdapter.ts

export interface GenericDatabaseAdapter {
    disconnect(): Promise<void>;

    /// Authenticated calls
    getUserData(user_id: UserId): Promise<IReturnValue>;
    updateUser(user_id: UserId, userObject: UserUpdateObject): Promise<IReturnValue>;
    updateProject(user_id: UserId, pkg: ProjectPackage): Promise<IReturnValue>;
    updateVerse(user_id: UserId, data: UpdateVerseData, project_id: ProjectId, reference_text: string): Promise<IReturnValue>;
    joinProject(user_id: UserId, project_id: ProjectId): Promise<IReturnValue>;
    getUserIds(): Promise<IReturnValue>;

    /// Non-authenticated calls
    getProjectIdExists(project_id: ProjectId): Promise<IReturnValue>;
    getVerse(project_id: ProjectId, user_id: UserId, reference: string): Promise<IReturnValue>;
    seekVerse(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after", exclusivity: "me" | "anyone"): Promise<IReturnValue>;
    getProjectDescriptions(): Promise<IReturnValue>;
}