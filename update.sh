#!/bin/bash

# Script Name: update.sh
# Description: Update the server with the latest code from the repositories.
# Author: Open Readers Bibles
# Date: 2024-11-02
# Version: 1.0

# Exit immediately if a command exits with a non-zero status.
set -e

# Pull the latest production branch server, build it, etc.
# First time:
# cd ~ && mkdir orb-server-prod
# cd ~/orb-server-prod && git clone https://github.com/openreadersbibles/orb-server.git --branch main orb-server
# cd ~/orb-server-prod && git clone https://github.com/openreadersbibles/models.git --branch main models
cd ~/orb-server-prod/models
git stash
git pull
cd ~/orb-server-prod/orb-server
git stash
git pull
npm install
npm run build

# Pull the latest development branch server, build it, etc.
# First time:
# cd ~ && mkdir orb-server-dev
# cd ~/orb-server-dev && git clone https://github.com/openreadersbibles/orb-server.git --branch dev orb-server
# cd ~/orb-server-dev && git clone https://github.com/openreadersbibles/models.git --branch dev models
cd ~/orb-server-dev/models
git stash
git pull
cd ~/orb-server-dev/orb-server
git stash
git pull
npm install
npm run build

cd ~
pm2 start ecosystem.config.js
# pm2 restart ~/orb-server/dist/server.js --update-env
