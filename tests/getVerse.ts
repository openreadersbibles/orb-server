jest.mock('../src/GitHubAdapter');
jest.mock('../src/authenticate');
import { setMockedUser } from '../src/MockUser.js';

import { VerseReference } from "@models/VerseReference.js";
import { GetHebrewVerseResponseSchema, GetNTVerseResponseSchema } from "@models/VerseResponse.js";
import { app } from "../src/server.js";
import request from 'supertest';
import { accessTokenFromJson } from "./acccessTokenFromJson.js";
import { Verse } from "@models/Verse.js";


export async function getVerse(project_id: string, reference: VerseReference, as_user: string): Promise<Verse> {
    setMockedUser(as_user);
    const response = await request(app)
        .get(`/verse/${project_id}/${reference.toString()}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', accessTokenFromJson(as_user));

    expect(response.status).toBe(200);
    const parsedJson = JSON.parse(response.body);
    if (reference.canon === "OT") {
        const verified = GetHebrewVerseResponseSchema.parse(parsedJson);
        return Verse.fromHebrewVerseResponse(reference, verified);
    } else if (reference.canon === "NT") {
        const verified = GetNTVerseResponseSchema.parse(parsedJson);
        return Verse.fromNTVerseResponse(reference, verified);
    } else {
        throw new Error(`Invalid canon: ${reference.canon}`);
    }
}