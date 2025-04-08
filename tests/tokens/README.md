# Getting Cognitio authorization tokens

## Read First
After all this, the access tokens that I'm getting back from the CLI are different from what I'm getting from the application's own auth flow. And they don't work. So for authorization testing you need to get the access tokens from the app and just paste them into `access-tokens.json`. Sigh.



(This seems harder than it should be; but fine, it's security.)

The secrets are in files like `orbadmin-auth.json`.

## The secret hash (calculated separately for each user)
This has to be calculated from the username, password, and client secret.

```
./make-secret-hash.sh <username> <password> <client secret>
```

Then it needs to be put in the auth `.json` file under `SECRET_HASH`.

## Save the access token in an environment variable

```
./set-access-token.sh orbadmin
```

It creates the environment variable `orbadmin_access_token` with the access token inside.

(NB: access tokens expire in half an hour, so this needs to be done routinely.)

## Set all the access tokens
This file can have lots of users set up.

```
./all-access-tokens.sh
```