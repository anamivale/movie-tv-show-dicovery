package main

import (
	"fmt"
	"log"
	"movie-discovery-app/internals/api"
	"net/http"
	"os"
)

func main() {
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize API routes
	router := api.NewRouter()

	// Start server
	fmt.Printf("🎬 Movie Discovery App starting on port %s\n", port)
	fmt.Printf("🌐 Open http://localhost:%s in your browser\n", port)

	log.Fatal(http.ListenAndServe(":"+port, router))
}
