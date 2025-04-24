import { CanonSchema } from "@models/Canon.js";
import { UbsBookSchema } from "@models/UbsBook.js";
import { ParamsDictionary } from "express-serve-static-core";
import { z } from "zod";

export type UserIdParams = Record<'user_id', string>;
export const GlossIdParamsSchema = z.object({
    gloss_id: z.string().regex(/^\d+$/).transform(Number).refine((val) => Number.isInteger(val) && val > 0, {
        message: "gloss_id must be a positive integer",
    }),
});

export type GlossIdParams = ParamsDictionary & z.infer<typeof GlossIdParamsSchema>;

export type ProjectIdParams = Record<'project_id', string>;

export const StatsParamsSchema = z.object({
    project_id: z.string(),
    canon: CanonSchema,
    book: UbsBookSchema.optional(),
});
export type StatsParams = ParamsDictionary & z.infer<typeof StatsParamsSchema>;

export type SeekVerseParams = Record<'project_id' | 'reference' | 'frequency_threshold' | 'startingPosition' | 'direction' | 'exclusivity', string>;

export type VerseParams = Record<'project_id' | 'reference', string>;

export type PublicationActionsParams = Record<'repo' | 'commit_sha', string>;

export type NoParams = ParamsDictionary;
