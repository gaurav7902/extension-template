#!/bin/bash

set -euo pipefail

REPO_NAME="$(basename "$PWD")"
OUTPUT="${REPO_NAME}-extension.zip"

if [[ ! -d "extension" ]]; then
    echo "Error: extension folder not found."
    exit 1
fi

cd extension || exit 1

rm -f "../$OUTPUT"

shopt -s dotglob nullglob
FILES=(*)

if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "Error: extension is empty."
    exit 1
fi

zip -r "../$OUTPUT" "${FILES[@]}"

echo "Created $OUTPUT from extension/"