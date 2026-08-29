//go:build !windows

package recorder

import (
	"os"
	"os/signal"
	"syscall"
)

func notifySIGWINCH(sigCh chan os.Signal) {
	signal.Notify(sigCh, syscall.SIGWINCH)
}
