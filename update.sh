#!/bin/bash

# Script Name: update.sh
# Description: Update the server with the latest code from the repositories.
# Author: Open Readers Bibles
# Date: 2024-11-02
# Version: 1.0

# Exit immediately if a command exits with a non-zero status.
set -e

cd ~/models
git stash
git pull
npm install
cd ~/orb-server
git stash
git pull
npm install
npx webpack
pm2 restart ~/orb-server/dist/server.js --update-env
