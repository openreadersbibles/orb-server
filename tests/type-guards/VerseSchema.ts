import { z } from "zod";

// Define the AnnotationType schema
export const AnnotationTypeSchema = z.enum(["word", "markdown", "wordplusmarkdown", "null"]);

// Define the WordAnnotationContent schema
export const WordAnnotationContentSchema = z.object({
    gloss: z.string(),
});

// Define the MarkdownAnnotationContent schema
export const MarkdownAnnotationContentSchema = z.object({
    markdown: z.string(),
});

// Define the WordPlusMarkdownAnnotationContent schema
export const WordPlusMarkdownAnnotationContentSchema = z.object({
    gloss: z.string(),
    markdown: z.string(),
});

// Define the AnnotationJsonObject schema
export const AnnotationJsonObjectSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("word"),
        content: WordAnnotationContentSchema,
    }),
    z.object({
        type: z.literal("markdown"),
        content: MarkdownAnnotationContentSchema,
    }),
    z.object({
        type: z.literal("wordplusmarkdown"),
        content: WordPlusMarkdownAnnotationContentSchema,
    }),
    z.object({
        type: z.literal("null"),
        content: z.string(),
    }),
]);

// Define the Annotation schema
export const AnnotationSchema = z.object({
    type: AnnotationTypeSchema,
    html: z.string(),
    tex: z.string(),
    toAnnotationObject: z.function().returns(AnnotationJsonObjectSchema),
});


const GlossRowSchema = z.object({
    jsonContent: z.string(),
    gloss_id: z.number(),
    votes: z.number(),
});

// Define OTGender schema
export const OTGenderSchema = z.enum(["NA", "f", "m", "unknown"]);

// Define OTGrammaticalNumber schema
export const OTGrammaticalNumberSchema = z.enum(["NA", "sg", "pl", "unknown", "du"]);

// Define OTPerson schema
export const OTPersonSchema = z.enum(["NA", "p1", "p2", "p3", "unknown"]);

// Define OTState schema
export const OTStateSchema = z.enum(["NA", "a", "c", "e"]);

// Define OTTense schema
export const OTTenseSchema = z.enum([
    "NA", "perf", "ptca", "wayq", "impf", "infc", "impv", "infa", "ptcp"
]);

// Define OTVerbStem schema
export const OTVerbStemSchema = z.enum([
    "NA", "qal", "piel", "hif", "nif", "pual", "hit", "hof", "hsht", "pasq",
    "hotp", "nit", "poal", "poel", "htpo", "peal", "tif", "etpa", "pael",
    "haf", "htpe", "htpa", "peil", "etpe", "afel", "shaf"
]);

// Define OTPartOfSpeech schema
export const OTPartOfSpeechSchema = z.enum([
    "prep", "subs", "verb", "art", "conj", "advb", "adjv", "intj", "prde",
    "nmpr", "nega", "prps", "prin", "inrg"
]);

// PhraseGlossRow schema
export const PhraseGlossRowSchema = z.object({
    phrase_gloss_id: z.number(),
    from_word_id: z.number(),
    to_word_id: z.number(),
    markdown: z.string(),
    votes: z.number(),
    myVote: z.number().nullable(), // NB: this is a gloss_id
});

// SuggestionRow schema
export const SuggestionRowSchema = z.object({
    lex_id: z.number(),
    suggestions: z.array(AnnotationJsonObjectSchema),
});

// HebrewWordRow schema
export const HebrewWordRowSchema = z.object({
    _id: z.number(),
    freq_lex: z.number(),
    g_word_utf8: z.string(),
    trailer_utf8: z.string(),
    lex_id: z.number(),
    votes: z.array(GlossRowSchema),
    myVote: z.number().nullable(), // NB: this is a gloss_id

    gn: OTGenderSchema,
    nu: OTGrammaticalNumberSchema,
    st: OTStateSchema,
    vt: OTTenseSchema,
    vs: OTVerbStemSchema,
    ps: OTPersonSchema,
    pdp: OTPartOfSpeechSchema,
    englishGloss: z.string(),
    prs_gn: OTGenderSchema,
    prs_nu: OTGrammaticalNumberSchema,
    prs_ps: OTPersonSchema,
    voc_lex_utf8: z.string(),
    languageISO: z.enum(["hbo", "arc", "grc"]),
});

// Define NTPartOfSpeech schema
export const NTPartOfSpeechSchema = z.enum([
    "particle",
    "verb",
    "relative-pronoun",
    "personal-pronoun",
    "interrogative-indefinite-pronoun",
    "demonstrative-pronoun",
    "definite-article",
    "preposition",
    "noun",
    "interjection",
    "adverb",
    "conjunction",
    "adjective",
]);

// Define NTPerson schema
export const NTPersonSchema = z.enum(["NA", "1st", "2nd", "3rd"]);

// Define NTTense schema
export const NTTenseSchema = z.enum([
    "NA",
    "present",
    "imperfect",
    "future",
    "aorist",
    "perfect",
    "pluperfect",
]);

// Define NTVoice schema
export const NTVoiceSchema = z.enum(["NA", "active", "middle", "passive"]);

// Define NTMood schema
export const NTMoodSchema = z.enum([
    "NA",
    "indicative",
    "imperative",
    "subjunctive",
    "optative",
    "infinitive",
    "participle",
]);

// Define NTCase schema
export const NTCaseSchema = z.enum([
    "NA",
    "nominative",
    "genitive",
    "dative",
    "accusative",
]);

// Define NTNumber schema
export const NTNumberSchema = z.enum(["NA", "singular", "plural"]);

// Define NTGender schema
export const NTGenderSchema = z.enum(["NA", "masculine", "feminine", "neuter"]);

// Define NTDegree schema
export const NTDegreeSchema = z.enum(["NA", "comparative", "superlative"]);

// GreekWordRow schema
export const GreekWordRowSchema = z.object({
    _id: z.number(),
    freq_lex: z.number(),
    lex_id: z.number(),
    myVote: z.number().nullable(), // NB: this is a gloss_id
    punctuated_text: z.string(),
    unpunctuated_text: z.string(),
    lemma: z.string(),
    part_of_speech: NTPartOfSpeechSchema,
    person: NTPersonSchema,
    tense: NTTenseSchema,
    voice: NTVoiceSchema,
    mood: NTMoodSchema,
    grammatical_case: NTCaseSchema,
    grammatical_number: NTNumberSchema,
    gender: NTGenderSchema,
    degree: NTDegreeSchema,
    languageISO: z.enum(["hbo", "arc", "grc"]),
    votes: z.array(GlossRowSchema),
    englishGloss: z.string(),
});


export function createVerseResponseSchema<T>(wordSchema: z.ZodType<T>) {
    return z.object({
        words: z.array(wordSchema),
        suggestions: z.array(SuggestionRowSchema),
        phrase_glosses: z.array(PhraseGlossRowSchema),
    });
}

export const GetHebrewVerseResponseSchema = createVerseResponseSchema(HebrewWordRowSchema);

export const GetNTVerseResponseSchema = createVerseResponseSchema(GreekWordRowSchema);
