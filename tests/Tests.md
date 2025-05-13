# API Tests


## auth.test.ts
These are tests of the use of the auth procedure. Since these rely on the actual cognito service, you need to provide actual access tokens in `tests/tokens/access-tokens.json`. (There is code in `tests/tokens` that tries to populate that file automatically, but it doesn't work and ended up not being worth the effort to get it work.)

This is the only test that uses the actual auth API. All of the others mock authentication using `mockAuthenticate.ts`.

## user.test.ts
Tests for user endpoints.

Currently these test response codes, but don't validate that all of the data is correctly changed in the database.

## project.test.ts
Tests for project creation, deletion, joining projects, etc. 

## versereference.test.ts
These are actually not tests of the endpoint but tests of the `VerseReference` data structure, particularly the `VerseReference.fromString` function (which is relevant to validating API input).

## verse.test.ts
Tests of querying verse data, and the verse seeking endpoint.

## gloss.test.ts
Tests of adding and editing glosses.

## phrasegloss.test.ts
Test of adding and editing phrase glosses.

## stats.test.ts
Tests the `/stats` endpoint. At this point it's tests of the data format, not of the actual statistics.

## publication.test.ts
Tests of endpoints `/check` and `/publish` (with mocked GitHub actions).

## ot.test.ts

Publication runs for every book of the OT canon, using the glosses from the bhsa project.

## nt.test.ts

Publication runs for every book of the NT canon, using the glosses from the sblgnt-biblebento project.

## Running them:

```
clear; npx jest tests/user.test.ts
clear; npx jest tests/project.test.ts
clear; npx jest tests/versereference.test.ts
clear; npx jest tests/verse.test.ts
clear; npx jest tests/gloss.test.ts
clear; npx jest tests/phrasegloss.test.ts
clear; npx jest tests/stats.test.ts
clear; npx jest tests/publication.test.ts

clear; npx jest tests/ot.test.ts
clear; npx jest tests/nt.test.ts
clear; npx jest tests/minimarkdown.test.ts

clear; npx jest tests/adhoc.test.ts
```
