package api

import (
	"encoding/json"
	"html/template"
	"movie-discovery-app/internals/services"
	"net/http"
	"path/filepath"
)

type Router struct {
	movieService *services.MovieService
}

func NewRouter() *http.ServeMux {
	movieService := services.NewMovieService()
	router := &Router{movieService: movieService}

	mux := http.NewServeMux()

	// Serve the main page
	mux.HandleFunc("/", router.handleHome)

	// API endpoints
	mux.HandleFunc("/api/search", router.handleSearch)
	mux.HandleFunc("/api/movie/", router.handleMovieDetails)
	mux.HandleFunc("/api/tv/", router.handleTVDetails)
	mux.HandleFunc("/api/trending", router.handleTrending)
	mux.HandleFunc("/api/genres", router.handleGenres)

	// Static files
	fs := http.FileServer(http.Dir("./web/static/"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	return mux
}

func (r *Router) handleHome(w http.ResponseWriter, req *http.Request) {
	if req.URL.Path != "/" {
		http.NotFound(w, req)
		return
	}

	tmplPath := filepath.Join("web", "templates", "index.html")
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		http.Error(w, "Template not found", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	tmpl.Execute(w, nil)
}

func (r *Router) handleSearch(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := req.URL.Query().Get("q")
	contentType := req.URL.Query().Get("type")
	page := req.URL.Query().Get("page")

	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	if page == "" {
		page = "1"
	}

	results, err := r.movieService.Search(query, contentType, page)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func (r *Router) handleMovieDetails(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract movie ID from URL path
	id := req.URL.Path[len("/api/movie/"):]
	if id == "" {
		http.Error(w, "Movie ID is required", http.StatusBadRequest)
		return
	}

	details, err := r.movieService.GetMovieDetails(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(details)
}

func (r *Router) handleTVDetails(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract TV show ID from URL path
	id := req.URL.Path[len("/api/tv/"):]
	if id == "" {
		http.Error(w, "TV show ID is required", http.StatusBadRequest)
		return
	}

	details, err := r.movieService.GetTVDetails(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(details)
}

func (r *Router) handleTrending(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	timeWindow := req.URL.Query().Get("time_window")
	if timeWindow == "" {
		timeWindow = "day"
	}

	trending, err := r.movieService.GetTrending(timeWindow)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trending)
}

func (r *Router) handleGenres(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	genres, err := r.movieService.GetGenres()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(genres)
}
