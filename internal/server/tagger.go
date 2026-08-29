package server

import (
	"bytes"
	"strings"

	"github.com/Nathanim1919/replay/internal/format"
)

// Known CLI tools and key technologies for auto-tagging
var toolKeywords = map[string]string{
	"docker":     "docker",
	"kubectl":    "kubernetes",
	"k8s":        "kubernetes",
	"git":        "git",
	"npm":        "node",
	"pnpm":       "node",
	"yarn":       "node",
	"bun":        "node",
	"go":         "golang",
	"cargo":      "rust",
	"rustc":      "rust",
	"python":     "python",
	"python3":    "python",
	"pip":        "python",
	"aws":        "aws",
	"gcloud":     "gcloud",
	"terraform":  "terraform",
	"curl":       "http",
	"wget":       "http",
	"make":       "build",
	"npx":        "node",
	"vite":       "frontend",
	"next":       "frontend",
	"postgres":   "database",
	"psql":       "database",
	"sqlite":     "database",
	"redis-cli":  "database",
}

// Action / Intent keywords
var actionKeywords = map[string]string{
	"test":     "testing",
	"build":    "build",
	"deploy":   "deployment",
	"error":    "error",
	"fatal":    "error",
	"panic":    "error",
	"failed":   "error",
	"install":  "setup",
}

// ExtractAutoTags analyzes session header and raw replay event payload to return a slice of tags.
func ExtractAutoTags(header format.Header, body []byte) []string {
	tagMap := make(map[string]bool)

	// 1. Tag based on shell name
	if header.Shell != "" {
		shellLower := strings.ToLower(header.Shell)
		if strings.Contains(shellLower, "zsh") {
			tagMap["zsh"] = true
		} else if strings.Contains(shellLower, "bash font") || strings.Contains(shellLower, "bash") {
			tagMap["bash"] = true
		} else if strings.Contains(shellLower, "fish") {
			tagMap["fish"] = true
		}
	}

	// 2. Tag based on session title
	if header.Title != "" {
		titleLower := strings.ToLower(header.Title)
		matchKeywords(titleLower, tagMap)
	}

	// 3. Decompress body if needed and scan lines for commands
	uncompressed := body
	if format.IsZstdCompressed(body) {
		if decomp, err := format.DecompressZstd(body); err == nil {
			uncompressed = decomp
		}
	}

	// Sample up to first 50KB for fast tagging
	sampleSize := len(uncompressed)
	if sampleSize > 50000 {
		sampleSize = 50000
	}

	contentLower := strings.ToLower(string(bytes.Map(func(r rune) rune {
		if r >= 'A' && r <= 'Z' {
			return r + ('a' - 'A')
		}
		if r < 32 && r != '\n' && r != '\t' {
			return -1 // Strip ANSI control sequences for clean matching
		}
		return r
	}, uncompressed[:sampleSize])))

	matchKeywords(contentLower, tagMap)

	// Convert map to slice
	tags := make([]string, 0, len(tagMap))
	for tag := range tagMap {
		tags = append(tags, tag)
	}

	// Default fallback tag if none discovered
	if len(tags) == 0 {
		tags = append(tags, "terminal")
	}

	return tags
}

func matchKeywords(text string, tagMap map[string]bool) {
	for word, tag := range toolKeywords {
		if strings.Contains(text, word) {
			tagMap[tag] = true
		}
	}
	for word, tag := range actionKeywords {
		if strings.Contains(text, word) {
			tagMap[tag] = true
		}
	}
}
