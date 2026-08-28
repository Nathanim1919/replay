package recorder

import (
	"os"
	"testing"
)

func TestCollectTelemetry(t *testing.T) {
	pid := os.Getpid()
	telemetry := CollectTelemetry(pid, "test_shell")

	if telemetry.PID != pid {
		t.Errorf("Expected PID %d, got %d", pid, telemetry.PID)
	}

	if telemetry.CWD == "" {
		t.Errorf("Expected non-empty CWD")
	}

	t.Logf("Collected Telemetry: PID=%d, CWD=%s, Mem=%.2fMB", telemetry.PID, telemetry.CWD, telemetry.Memory)
}
