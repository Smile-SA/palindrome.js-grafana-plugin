#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

cd parser
node ./populateInflux.js # to be deleted once we get real data
node ./grafanaParser.js # parse and build Flux queries
cd ..
jsonnet -J vendor generateDashboard.jsonnet > dashboard.json # generate dashboard
node ./parser/pushDashboard.js # push dashboard
