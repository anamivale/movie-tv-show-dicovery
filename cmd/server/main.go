package main

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"movie-discovery-app/internal/api"
)

// loadEnv loads environment variables from .env file
func loadEnv() {
	file, err := os.Open("./configs/.env")
	if err != nil {
		// .env file doesn't exist, that's okay
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Split on first = sign
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			// Only set if not already set in environment
			if os.Getenv(key) == "" {
				os.Setenv(key, value)
			}
		}
	}
}

func main() {
	// Load environment variables from .env file
	loadEnv()

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize API routes
	router := api.NewRouter()

	// Start server
	fmt.Printf("Movie Discovery App starting on port %s\n", port)
	fmt.Printf("Open http://localhost:%s in your browser\n", port)

	
	log.Fatal(http.ListenAndServe(":"+port, router))
}
