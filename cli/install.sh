#!/bin/bash

set -e

BINARY_URL="https://codebhejo.in/download/codebhejo-linux-amd64"
BINARY_NAME="codebhejo"
INSTALL_PATH="/usr/local/bin/$BINARY_NAME"

echo "Downloading Codebhejo CLI..."
curl -L "$BINARY_URL" -o "$BINARY_NAME"

echo "Making it executable..."
chmod +x "$BINARY_NAME"

echo "Moving to $INSTALL_PATH (requires sudo)..."
sudo mv "$BINARY_NAME" "$INSTALL_PATH"

echo "Installation complete!"
echo "You can now run 'codebhejo version' to verify."
