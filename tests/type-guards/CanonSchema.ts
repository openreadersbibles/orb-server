import { z } from "zod";

// Zod schema for UbsBook
export const UbsBookSchema = z.enum([
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST",
    "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM",
    "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
    "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
]);

// Zod schema for OTBook
export const OTBookSchema = z.enum([
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST",
    "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM",
    "HAB", "ZEP", "HAG", "ZEC", "MAL",
]);

// Zod schema for NTBook
export const NTBookSchema = z.enum([
    "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT",
    "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
]);

// Zod schema for LatinBook
export const LatinBookSchema = z.enum([
    "Genesis", "Exodus", "Leviticus", "Numeri", "Deuteronomium", "Josua", "Judices", "Ruth", "Samuel_I", "Samuel_II",
    "Reges_I", "Reges_II", "Chronica_I", "Chronica_II", "Esra", "Nehemia", "Esther", "Iob", "Psalmi", "Proverbia",
    "Ecclesiastes", "Canticum", "Jesaia", "Jeremia", "Threni", "Ezechiel", "Daniel", "Hosea", "Joel", "Amos", "Obadia",
    "Jona", "Micha", "Nahum", "Habakuk", "Zephania", "Haggai", "Sacharia", "Maleachi", "secundum Matthæum",
    "secundum Marcum", "secundum Lucam", "secundum Ioannem", "Actus", "ad Romanos", "1 ad Corinthios", "2 ad Corinthios",
    "ad Galatas", "ad Ephesios", "ad Philippenses", "ad Colossenses", "1 ad Thessalonicenses", "2 ad Thessalonicenses",
    "1 ad Timotheum", "2 ad Timotheum", "ad Titum", "ad Philemonem", "ad Hebræos", "Iacobi", "1 Petri", "2 Petri",
    "1 Ioannis", "2 Ioannis", "3 Ioannis", "Iudæ", "Apocalypsis",
]);

// Zod schema for Canon
export const CanonSchema = z.enum(["OT", "NT", "LXX"]);