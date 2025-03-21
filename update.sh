#!/bin/bash

# Script Name: update.sh
# Description: Update the server with the latest code from the repositories.
# Author: Open Readers Bibles
# Date: 2024-11-02
# Version: 1.0

# Exit immediately if a command exits with a non-zero status.
set -e

# Pull the latest 'models' repository
cd ~/models
git stash
git pull
npm install

# Pull the latest production branch server, build it, etc.
cd ~/orb-server
git stash
git pull
npm install
npx webpack

# Pull the latest production branch server, build it, etc.
cd ~/orb-server-dev
git stash
git pull
npm install
npx webpack

pm2 start ecosystem.config.js
# pm2 restart ~/orb-server/dist/server.js --update-env
