#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Note the funny paths because the tests are executed in the /src directory

# Run the set-access-token script for orbadmin
./../tests/tokens/set-access-token.sh orbadmin

# Run the set-access-token script for farhad_ebrahimi
./../tests/tokens/set-access-token.sh farhad_ebrahimi
