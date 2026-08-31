#!/usr/bin/env bash

set -e

# Replay One-Line CLI Installer
# Usage: curl -fsSL https://cdn.jsdelivr.net/gh/Nathanim1919/replay@trunk/install.sh | bash

REPO="Nathanim1919/replay"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="replay"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64)
    ARCH="amd64"
    ;;
  arm64|aarch64)
    ARCH="arm64"
    ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

case "$OS" in
  linux)
    TARGET="replay-linux-${ARCH}"
    ;;
  darwin)
    TARGET="replay-darwin-${ARCH}"
    ;;
  *)
    echo "Unsupported operating system: $OS"
    exit 1
    ;;
esac

echo "🚀 Downloading Replay CLI for ${OS}/${ARCH}..."

LATEST_TAG=$(curl -sSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_TAG" ]; then
  LATEST_TAG="v1.0.0"
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${TARGET}"

TMP_DIR=$(mktemp -d)
curl -fsSL "$DOWNLOAD_URL" -o "${TMP_DIR}/${BINARY_NAME}"

chmod +x "${TMP_DIR}/${BINARY_NAME}"

if [ -w "$INSTALL_DIR" ]; then
  mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
else
  echo "🔒 Sudo permissions required to install to ${INSTALL_DIR}"
  sudo mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
fi

rm -rf "$TMP_DIR"

echo "✅ Replay CLI installed successfully to ${INSTALL_DIR}/${BINARY_NAME}!"
echo ""
echo "Run 'replay help' or 'replay login' to get started."
