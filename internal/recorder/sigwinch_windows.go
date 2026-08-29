//go:build windows

package recorder

import (
	"os"
)

func notifySIGWINCH(sigCh chan os.Signal) {
	// SIGWINCH is not supported on Windows
}
