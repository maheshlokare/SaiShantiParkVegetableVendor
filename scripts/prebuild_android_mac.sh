#!/usr/bin/env bash
set -e
echo "== Prebuilding Android project =="
npm install
npm run android:prebuild
npm run android:open
