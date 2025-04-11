import { UpdateVerseData } from "../../models/database-input-output.js";
import { GreekWordRow } from "../../models/GreekWordRow.js";
import { HebrewWordRow } from "../../models/HebrewWordRow.js";
import { ProjectConfiguration, ProjectConfigurationRow, ProjectDescription, ProjectId } from "../../models/ProjectConfiguration.js";
import { UserId, UserProfileRow, UserUpdateObject } from "../../models/UserProfile.js";
import { Canon, UbsBook, VerseReference } from "../../models/VerseReference.js";
import { VerseResponse } from "../../models/Verse.js";
import { BookIdentifier } from "../../models/BookIdentifier.js";
import { BookDumpJson, PublicationBook } from "../../models/publication/PublicationBook.js";
import { PublicationGreekWordElementRow } from "../../models/publication/PublicationGreekWordElementRow.js";
import { PublicationHebrewWordElementRow } from "../../models/publication/PublicationHebrewWordElementRow.js";

/// See the implementations in SqliteAdapter.ts and MariaDbAdapter.ts

export interface GenericDatabaseAdapter {
    disconnect(): Promise<void>;

    getUserData(user_id: UserId): Promise<UserProfileRow>;
    updateUser(user_id: UserId, userObject: UserUpdateObject): Promise<boolean>;
    removeUser(user_id: UserId): Promise<boolean>;
    createProject(user_id: UserId, project: ProjectConfigurationRow): Promise<boolean>;
    updateProject(user_id: UserId, project: ProjectConfigurationRow): Promise<boolean>;
    removeProject(project_id: ProjectId): Promise<boolean>;
    updateVerse(user_id: UserId, data: UpdateVerseData, project_id: ProjectId, reference_text: string): Promise<boolean>;
    joinProject(user_id: UserId, project_id: ProjectId): Promise<boolean>;
    getUserIds(): Promise<string[]>;
    getProjectIdExists(project_id: ProjectId): Promise<boolean>;
    getOTVerse(project_id: ProjectId, user_id: UserId, reference: VerseReference): Promise<VerseResponse<HebrewWordRow>>
    getNTVerse(project_id: ProjectId, user_id: UserId, reference: VerseReference): Promise<VerseResponse<GreekWordRow>>;
    seekVerse(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after", exclusivity: "me" | "anyone"): Promise<VerseReference>;
    getProjectDescriptions(): Promise<ProjectDescription[]>;

    /* Publication Functions */
    getProjectFromId(project_id: ProjectId): Promise<ProjectConfiguration>;
    checkForMissingGlosses(project: ProjectConfiguration, bid: BookIdentifier): Promise<string[]>;
    getDatabaseRows<T extends PublicationGreekWordElementRow | PublicationHebrewWordElementRow>(project_id: ProjectId, bid: BookIdentifier, query: string): Promise<BookDumpJson<T>>;
    getCanonicalBookName(canon: Canon, book: UbsBook): Promise<string | undefined>;
    getFontUrlsForFamiliy(family: string): Promise<string[]>;
    getOTBook(project_id: ProjectId, bid: BookIdentifier): Promise<PublicationBook<PublicationHebrewWordElementRow>>;
    getNTBook(project_id: ProjectId, bid: BookIdentifier): Promise<PublicationBook<PublicationGreekWordElementRow>>;
}