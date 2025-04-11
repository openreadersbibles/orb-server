import { ParamsDictionary } from "express-serve-static-core";
import { ProjectId } from "../../models/ProjectConfiguration";
import { UserId } from "../../models/UserProfile";
import { VerseReferenceString } from "../../models/VerseReference";

export interface UserIdParams extends ParamsDictionary {
    user_id: UserId;
}

export interface ProjectIdParams extends ParamsDictionary {
    user_id: ProjectId;
}

export interface SeekVerseParams extends ParamsDictionary {
    project_id: ProjectId;
    user_id: UserId;
    frequency_threshold: string;
    startingPosition: VerseReferenceString;
    direction: "before" | "after";
    exclusivity: "me" | "anyone";
}

export interface VerseParams extends ParamsDictionary {
    project_id: ProjectId;
    user_id: UserId;
    reference: VerseReferenceString;
}

export interface PublicationActionsParams extends ParamsDictionary {
    repo: string;
    commit_sha: string;
}

export type NoParams = ParamsDictionary;
