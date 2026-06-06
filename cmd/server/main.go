package main

import (
	"fmt"
	"github.com/Nathanim1919/replay/internal/server"
	"github.com/Nathanim1919/replay/internal/server/auth"
	"github.com/joho/godotenv"
	"net/http"
	"os"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file:", err)
		os.Exit(1)
	}
	PORT := os.Getenv("PORT")
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
	authHandler := &auth.Handler{
		Service:     &auth.Service{Users: sessionStore},
		DeviceStore: auth.NewDeviceAuthStore(),
	}
	svr := server.NewServer(sessionStore, blobStore, authHandler)
	fmt.Println("Server started on port", PORT)
	err = http.ListenAndServe(":" + PORT, svr.Router())
	if err != nil {
		fmt.Println("Error starting server:", err)
		os.Exit(1)
	}
}
