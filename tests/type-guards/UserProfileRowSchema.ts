import { z } from "zod";
import { ProjectConfigurationRowSchema } from "./ProjectConfigurationRowSchema";

// Define the Zod schema for UserProfileRow
export const UserProfileRowSchema = z.object({
    user_id: z.string(),
    user_description: z.string(),
    projects: z.array(ProjectConfigurationRowSchema)
    // projects: z
    //     .string()
    //     .transform((val) => JSON.parse(val)) // Parse the JSON string into an array
    //     .refine(
    //         (arr) => Array.isArray(arr) && arr.every((item) => ProjectConfigurationRowSchema.parse(item)),
    //         { message: "Invalid ProjectConfigurationRowSchema objects in projects array" }
    //     ),
});