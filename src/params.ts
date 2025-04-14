import { ParamsDictionary } from "express-serve-static-core";

export type UserIdParams = Record<'user_id', string>;

export type ProjectIdParams = Record<'project_id', string>;

export type SeekVerseParams = Record<'user_id' | 'project_id' | 'reference' | 'frequency_threshold' | 'startingPosition' | 'direction' | 'exclusivity', string>;

export type VerseParams = Record<'project_id' | 'user_id' | 'reference', string>;

export type PublicationActionsParams = Record<'repo' | 'commit_sha', string>;

export type NoParams = ParamsDictionary;
