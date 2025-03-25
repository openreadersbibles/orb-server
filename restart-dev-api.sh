#!/bin/bash

# Script Name: update.sh
# Description: Restart the dev-api server.
# Author: Open Readers Bibles
# Date: 2024-11-02
# Version: 1.0

# Exit immediately if a command exits with a non-zero status.
set -e

cd ~/orb-server-dev
npx webpack
cd ~
pm2 start ecosystem.config.js
