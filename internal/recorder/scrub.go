package recorder

import (
	"bytes"
	"regexp"
)

// PatternRule represents a named DLP redaction rule.
type PatternRule struct {
	Name        string
	Regex       *regexp.Regexp
	Replacement string
}

// Scrubber handles inline secret redacting for event streams.
type Scrubber struct {
	rules []PatternRule
}

// NewScrubber initializes a Scrubber with default enterprise security patterns.
func NewScrubber() *Scrubber {
	s := &Scrubber{
		rules: make([]PatternRule, 0),
	}
	s.loadDefaultRules()
	return s
}

func (s *Scrubber) loadDefaultRules() {
	// AWS Access Key ID (AKIA...)
	s.AddRule("AWS Access Key", `AKIA[0-9A-Z]{16}`, "[REDACTED_AWS_KEY]")

	// AWS Secret Access Key assignment
	s.AddRule("AWS Secret Key", `(?i)(aws_secret_access_key|aws_secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?`, "$1=[REDACTED_AWS_SECRET]")

	// RSA / EC / SSH Private Keys
	s.AddRule("Private Key", `-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY(?: BLOCK)?-----[[\s\S]*?-----END (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY(?: BLOCK)?-----`, "[REDACTED_PRIVATE_KEY]")

	// JWT (JSON Web Tokens)
	s.AddRule("JWT Token", `eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+`, "[REDACTED_JWT]")

	// GitHub Tokens (Classic ghp_ and Fine-grained github_pat_)
	s.AddRule("GitHub Personal Access Token", `ghp_[A-Za-z0-9]{36}`, "[REDACTED_GITHUB_TOKEN]")
	s.AddRule("GitHub Fine-Grained Token", `github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}`, "[REDACTED_GITHUB_PAT]")

	// Slack API Tokens (xoxb-, xoxp-, xoxa-, xoxr-)
	s.AddRule("Slack Token", `xox[baprs]-[0-9A-Za-z]{10,48}`, "[REDACTED_SLACK_TOKEN]")

	// Generic Password / Secret Key Value Pairs (e.g. DB_PASSWORD=xyz, api_key: "abc")
	s.AddRule("Generic Key Value Secret", `(?i)\b([A-Za-z0-9_]*(?:password|passwd|secret|api_key|apikey|auth_token))\s*[:=]\s*["']?([^\s"';]+)["']?`, "$1=[REDACTED_SECRET]")

	// Database Connection URIs containing passwords (postgres://user:pass@host)
	s.AddRule("Database Connection String Password", `(?i)(postgres|postgresql|mysql|mongodb|redis)://([^:]+):([^@]+)@`, "$1://$2:[REDACTED_DB_PASS]@")
}

// AddRule allows adding custom regex rules to the scrubber.
func (s *Scrubber) AddRule(name, pattern, replacement string) {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return
	}
	s.rules = append(s.rules, PatternRule{
		Name:        name,
		Regex:       re,
		Replacement: replacement,
	})
}

// Scrub scans the input data byte slice and replaces all detected secret patterns.
func (s *Scrubber) Scrub(data []byte) []byte {
	if len(data) == 0 {
		return data
	}

	result := data
	for _, rule := range s.rules {
		if rule.Regex.Match(result) {
			result = rule.Regex.ReplaceAll(result, []byte(rule.Replacement))
		}
	}

	return result
}

// ScrubString scans a string payload and redacts sensitive patterns.
func (s *Scrubber) ScrubString(data string) string {
	return string(s.Scrub([]byte(data)))
}

// QuickCheck fast-path to check if data contains any sensitive keyword hints before running full regex.
func (s *Scrubber) QuickCheck(data []byte) bool {
	keywords := [][]byte{
		[]byte("AKIA"),
		[]byte("eyJ"),
		[]byte("ghp_"),
		[]byte("PRIVATE KEY"),
		[]byte("password"),
		[]byte("secret"),
		[]byte("api_key"),
		[]byte("apikey"),
		[]byte("xox"),
	}
	lower := bytes.ToLower(data)
	for _, kw := range keywords {
		if bytes.Contains(lower, bytes.ToLower(kw)) {
			return true
		}
	}
	return false
}
