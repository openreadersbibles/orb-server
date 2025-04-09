import { z } from "zod";
import { CanonSchema } from "./CanonSchema";

// Define dependent schemas
const ThresholdObjectSchema = z.record(z.number()); // { [key: string]: number }
const BooknamesObjectSchema = z.record(z.string()); // { [key: string]: string }
const ProjectRoleSchema = z.enum(['admin', 'member', 'disabled']); // ProjectRole
const ProjectRoleRowSchema = z.object({
    user_id: z.string(),
    user_role: ProjectRoleSchema,
    power_user: z.union([z.literal(1), z.literal(0)]), // 1 or 0
});

// Define the StringLookup schema
const StringLookupSchema = z.record(z.string()); // Represents { [key: string]: string }

// Define the ParsingFormatObject schema
export const ParsingFormatObjectSchema = z.object({
    id: z.string(), // The `id` field is a string
    template: z.string(), // The `template` field is a string
    translations: StringLookupSchema, // The `translations` field is a StringLookup object
});

const ParsingFormatIdSchema = z.string(); // Assuming ParsingFormatId is a string

// Define the main schema
export const ProjectParsingFormatsObjectSchema = z.record(
    CanonSchema, // Canon as the key
    z.record(ParsingFormatIdSchema, ParsingFormatObjectSchema) // Record<ParsingFormatId, ParsingFormatObject>
); // Partial<Record<Canon, Record<ParsingFormatId, ParsingFormatObject>>>


export const PublicationFootnoteStyleSchema = z.enum(["lettered-by-verse", "numbered-by-page"]);

export const PublicationConfigurationRowSchema = z.object({
    footnoteMarkers: z.array(z.string()), // Array of strings
    polyglossiaOtherLanguage: z.string(), // String
    chapterHeader: z.string(), // String
    publication_project_font: z.string(), // String
    publication_biblical_font: z.string(), // String
    latex_template: z.string(), // String
    parsing_formats: z.record(z.string()), // Record<string, string>
    css_template: z.string().optional(), // String
    footnote_style: PublicationFootnoteStyleSchema.optional(), // Enum for footnote styles
});

// Define the main schema
export const ProjectConfigurationRowSchema = z.object({
    project_id: z.string(), // Assuming ProjectId is a string
    project_title: z.string(),
    project_description: z.string(),
    layout_direction: z.enum(['ltr', 'rtl']), // LayoutDirection
    frequency_thresholds: ThresholdObjectSchema,
    bookNames: BooknamesObjectSchema,
    canons: z.array(CanonSchema),
    roles: z.array(ProjectRoleRowSchema),
    allow_joins: z.boolean(),
    font_families: z.string(),
    font_size: z.number().optional(), // number | undefined
    parsing_formats: ProjectParsingFormatsObjectSchema,
    publication_configurations: z.record(PublicationConfigurationRowSchema).optional(), // { [key: string]: PublicationConfigurationRow }
    numerals: z.array(z.string()),
});

export const ProjectDescriptionSchema = z.object({
    project_id: z.string(), // Assuming ProjectId is a string
    project_title: z.string(),
    project_description: z.string(),
    allow_joins: z.boolean(),
});