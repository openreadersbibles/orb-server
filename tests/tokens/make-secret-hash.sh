#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <username> <app_client_id> <app_client_secret>"
    exit 1
fi

username=$1
app_client_id=$2
app_client_secret=$3

echo -n "${username}${app_client_id}" | openssl dgst -sha256 -hmac "${app_client_secret}" -binary | openssl enc -base64