#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if the argument is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <auth-file-prefix>"
    echo "Example: $0 orbadmin"
    exit 1
fi

# Get the argument (e.g., "orbadmin")
AUTH_FILE_PREFIX=$1
# Note the funny paths because the tests are executed in the /src directory
AUTH_FILE="./../tests/tokens/${AUTH_FILE_PREFIX}-auth.json"
ACCESS_TOKENS_FILE="./../tests/tokens/access-tokens.json"

# Check if the auth file exists
if [ ! -f "$AUTH_FILE" ]; then
    echo "Error: File '$AUTH_FILE' not found!"
    exit 1
fi

# Run the AWS Cognito command
RESPONSE=$(aws cognito-idp admin-initiate-auth --region us-east-1 --cli-input-json file://"$AUTH_FILE")

# Extract the AccessToken from the JSON response
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.AuthenticationResult.AccessToken')

# Check if AccessToken was successfully extracted
if [ "$ACCESS_TOKEN" == "null" ]; then
    echo "Error: Failed to retrieve AccessToken from the response."
    exit 1
fi

# Ensure the access-tokens.json file exists
if [ ! -f "$ACCESS_TOKENS_FILE" ]; then
    echo "{}" > "$ACCESS_TOKENS_FILE"
fi

# Update the JSON file with the new token
UPDATED_JSON=$(jq --arg key "$AUTH_FILE_PREFIX" --arg value "$ACCESS_TOKEN" '.[$key] = $value' "$ACCESS_TOKENS_FILE")
echo "$UPDATED_JSON" > "$ACCESS_TOKENS_FILE"

# Output confirmation
echo "Access token for $AUTH_FILE_PREFIX has been updated in $ACCESS_TOKENS_FILE."