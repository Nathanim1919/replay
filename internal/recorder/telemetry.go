package recorder

import (
	"fmt"
	"os"
	"runtime"
	"strings"
)

// ProcessTelemetry contains OS process context synchronized with the recording timeline.
type ProcessTelemetry struct {
	PID     int     `json:"pid"`
	CWD     string  `json:"cwd"`
	Cmd     string  `json:"cmd,omitempty"`
	CPU     float64 `json:"cpu_pct,omitempty"`
	Memory  float64 `json:"mem_mb,omitempty"`
}

// CollectTelemetry captures current working directory and OS metadata for the given process ID.
func CollectTelemetry(pid int, fallbackShell string) ProcessTelemetry {
	telemetry := ProcessTelemetry{
		PID: pid,
		Cmd: fallbackShell,
	}

	// 1. Resolve Current Working Directory (CWD)
	cwd := getProcessCWD(pid)
	if cwd == "" {
		cwd, _ = os.Getwd()
	}
	telemetry.CWD = cwd

	// 2. Read memory stats (Linux /proc or runtime fallback)
	memMB := getProcessMemoryMB(pid)
	telemetry.Memory = memMB

	return telemetry
}

// getProcessCWD attempts to read the symlink for /proc/<pid>/cwd on Linux.
func getProcessCWD(pid int) string {
	if runtime.GOOS == "linux" {
		linkPath := fmt.Sprintf("/proc/%d/cwd", pid)
		target, err := os.Readlink(linkPath)
		if err == nil {
			return target
		}
	}
	return ""
}

// getProcessMemoryMB retrieves Resident Set Size (RSS) memory in MB on Linux or runtime fallback.
func getProcessMemoryMB(pid int) float64 {
	if runtime.GOOS == "linux" {
		statPath := fmt.Sprintf("/proc/%d/statm", pid)
		data, err := os.ReadFile(statPath)
		if err == nil {
			fields := strings.Fields(string(data))
			if len(fields) >= 2 {
				// Second field in statm is RSS in pages
				var pages uint64
				fmt.Sscanf(fields[1], "%d", &pages)
				pageSize := uint64(os.Getpagesize())
				bytes := pages * pageSize
				return float64(bytes) / (1024 * 1024)
			}
		}
	}

	// Fallback to Go runtime stats allocation if /proc is unavailable
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return float64(m.Alloc) / (1024 * 1024)
}
