package recorder

import (
	"testing"
)

func TestScrubber_AWSKey(t *testing.T) {
	scrubber := NewScrubber()

	input := "export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\n"
	expected := "export AWS_ACCESS_KEY_ID=[REDACTED_AWS_KEY]\n"

	output := scrubber.ScrubString(input)
	if output != expected {
		t.Errorf("Expected:\n%s\nGot:\n%s", expected, output)
	}
}

func TestScrubber_JWTToken(t *testing.T) {
	scrubber := NewScrubber()

	jwt := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
	input := "Authorization: Bearer " + jwt + "\n"
	expected := "Authorization: Bearer [REDACTED_JWT]\n"

	output := scrubber.ScrubString(input)
	if output != expected {
		t.Errorf("Expected:\n%s\nGot:\n%s", expected, output)
	}
}

func TestScrubber_GitHubToken(t *testing.T) {
	scrubber := NewScrubber()

	input := "git clone https://ghp_1234567890abcdefghijklmnopqrstuvwxyz@github.com/org/repo.git"
	expected := "git clone https://[REDACTED_GITHUB_TOKEN]@github.com/org/repo.git"

	output := scrubber.ScrubString(input)
	if output != expected {
		t.Errorf("Expected:\n%s\nGot:\n%s", expected, output)
	}
}

func TestScrubber_GenericPassword(t *testing.T) {
	scrubber := NewScrubber()

	input := "DB_PASSWORD=my_super_secret_pass_123!"
	expected := "DB_PASSWORD=[REDACTED_SECRET]"

	output := scrubber.ScrubString(input)
	if output != expected {
		t.Errorf("Expected:\n%s\nGot:\n%s", expected, output)
	}
}

func TestScrubber_DBConnectionString(t *testing.T) {
	scrubber := NewScrubber()

	input := "postgres://admin:secretPass123@localhost:5432/replay_db"
	expected := "postgres://admin:[REDACTED_DB_PASS]@localhost:5432/replay_db"

	output := scrubber.ScrubString(input)
	if output != expected {
		t.Errorf("Expected:\n%s\nGot:\n%s", expected, output)
	}
}

func TestScrubber_NoSecret(t *testing.T) {
	scrubber := NewScrubber()

	input := "$ kubectl get pods -n production\nNAME    READY   STATUS\napi-1   1/1     Running\n"
	output := scrubber.ScrubString(input)

	if output != input {
		t.Errorf("Clean input modified! Expected:\n%s\nGot:\n%s", input, output)
	}
}
