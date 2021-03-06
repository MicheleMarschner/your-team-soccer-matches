#!/usr/bin/env bash

GREEN='\033[0;32m'
LIGHT_BLUE='\033[1;34m'
NC='\033[0m'

echo "‣ Bustin some cache..."
rm ../your-team-soccer-matches.10m.js
rm -r .cache

echo "‣ Prepending header-data (shebang, birbar meta data, user config) to index.js..."
echo -e "‣ Moving and renaming index.js to ${LIGHT_BLUE}your-team-soccer-matches.10m.js${NC} in parent directory..."
cat ./header-data.js ./temp/index.js >> ../your-team-soccer-matches.10m.js

echo "‣ Granting execution access..."
chmod +x ../your-team-soccer-matches.10m.js

echo "‣ Cleaning up..."
rm -r temp

echo -e "${GREEN}✔ Done!${NC}"