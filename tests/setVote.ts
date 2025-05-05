import { GlossSendObject } from "@models/GlossSendObject";
import { ProjectId } from "@models/ProjectConfiguration";
import { UpdateVerseData } from "@models/UpdateVerseData";
import { UserId } from "@models/UserProfile";
import { WrappedBody } from "@models/WrappedBody";
import request from 'supertest';
import { app } from '../src/server.js';
import { accessTokenFromJson } from "./acccessTokenFromJson";
import { AnnotationJsonObject } from "@models/AnnotationJsonObject";
import { WordGlossLocationObject } from "@models/WordGlossLocationObject";

export async function setVote(refString: string, user_id: UserId, project_id: ProjectId, location: WordGlossLocationObject, annotation: AnnotationJsonObject, vote: 1 | 0) {

    const gso: GlossSendObject = {
        annotationObject: annotation,
        votes: (vote === 1 ? [user_id] : []),
        location: location,
    }
    const verseUpdate: UpdateVerseData = {
        word_gloss_updates: [gso],
        phrase_gloss_updates: [],
    }
    const wb: WrappedBody<UpdateVerseData> = {
        body: verseUpdate,
        hash: "dummy_hash",
    };
    await request(app)
        .post(`/verse/${project_id}/${refString}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', accessTokenFromJson("orbadmin"))
        .send(wb);
}