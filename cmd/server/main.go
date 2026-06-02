package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Nathanim1919/replay/internal/server"
)

func main() {
	sessionStore, err := server.NewSQLiteStore("sessions.db")
	if err != nil {
		fmt.Println("Error creating session store:", err)
		os.Exit(1)
	}
	blobStore, err := server.NewLocalBlobStore("blobs")
	if err != nil {
		fmt.Println("Error creating blob store:", err)
		os.Exit(1)
	}
	svr := server.NewServer(sessionStore, blobStore)
	fmt.Println("Server started on port 8080")
	err = http.ListenAndServe(":8080", svr.Router())
	if err != nil {
		fmt.Println("Error starting server:", err)
		os.Exit(1)
	}
}
