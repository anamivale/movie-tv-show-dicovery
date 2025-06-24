package services

import (
	"encoding/json"
	"fmt"
	"io"
	"movie-discovery-app/internals/models"
	"net/http"
	"net/url"
	"os"
	"time"
)

type MovieService struct {
	tmdbAPIKey   string
	omdbAPIKey   string
	tmdbBaseURL  string
	omdbBaseURL  string
	imageBaseURL string
	httpClient   *http.Client
}

func NewMovieService() *MovieService {
	return &MovieService{
		tmdbAPIKey:   getEnvOrDefault("TMDB_API_KEY", ""),
		omdbAPIKey:   getEnvOrDefault("OMDB_API_KEY", ""),
		tmdbBaseURL:  getEnvOrDefault("TMDB_BASE_URL", "https://api.themoviedb.org/3"),
		omdbBaseURL:  getEnvOrDefault("OMDB_BASE_URL", "http://www.omdbapi.com"),
		imageBaseURL: getEnvOrDefault("TMDB_IMAGE_BASE_URL", "https://image.tmdb.org/t/p/w500"),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Search searches for movies and TV shows
func (s *MovieService) Search(query, contentType, page string) (*models.SearchResponse, error) {
	if s.tmdbAPIKey == "" {
		return nil, fmt.Errorf("TMDB API key not configured")
	}

	endpoint := "search/multi"
	switch contentType {
case "movie":
		endpoint = "search/movie"
	case "tv":
		endpoint = "search/tv"
	}

	params := url.Values{}
	params.Add("api_key", s.tmdbAPIKey)
	params.Add("query", query)
	params.Add("page", page)
	params.Add("include_adult", "false")

	url := fmt.Sprintf("%s/%s?%s", s.tmdbBaseURL, endpoint, params.Encode())

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to search: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var searchResponse models.SearchResponse
	if err := json.Unmarshal(body, &searchResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Add full image URLs
	for i := range searchResponse.Results {
		if searchResponse.Results[i].PosterPath != "" {
			searchResponse.Results[i].PosterPath = s.imageBaseURL + searchResponse.Results[i].PosterPath
		}
		if searchResponse.Results[i].BackdropPath != "" {
			searchResponse.Results[i].BackdropPath = s.imageBaseURL + searchResponse.Results[i].BackdropPath
		}
	}

	return &searchResponse, nil
}

// GetMovieDetails gets detailed information about a movie
func (s *MovieService) GetMovieDetails(id string) (*models.MovieDetails, error) {
	if s.tmdbAPIKey == "" {
		return nil, fmt.Errorf("TMDB API key not configured")
	}

	params := url.Values{}
	params.Add("api_key", s.tmdbAPIKey)
	params.Add("append_to_response", "credits,external_ids")

	url := fmt.Sprintf("%s/movie/%s?%s", s.tmdbBaseURL, id, params.Encode())

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get movie details: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var movieDetails models.MovieDetails
	if err := json.Unmarshal(body, &movieDetails); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Add full image URLs
	if movieDetails.PosterPath != "" {
		movieDetails.PosterPath = s.imageBaseURL + movieDetails.PosterPath
	}
	if movieDetails.BackdropPath != "" {
		movieDetails.BackdropPath = s.imageBaseURL + movieDetails.BackdropPath
	}

	// Add full profile image URLs for cast
	if movieDetails.Credits != nil {
		for i := range movieDetails.Credits.Cast {
			if movieDetails.Credits.Cast[i].ProfilePath != "" {
				movieDetails.Credits.Cast[i].ProfilePath = s.imageBaseURL + movieDetails.Credits.Cast[i].ProfilePath
			}
		}
	}

	// Get additional data from OMDB if IMDB ID is available
	if movieDetails.ExternalIDs != nil && movieDetails.ExternalIDs.IMDBID != "" && s.omdbAPIKey != "" {
		omdbData, err := s.getOMDBData(movieDetails.ExternalIDs.IMDBID)
		if err == nil {
			movieDetails.OMDBData = omdbData
		}
	}

	return &movieDetails, nil
}

// GetTVDetails gets detailed information about a TV show
func (s *MovieService) GetTVDetails(id string) (*models.TVDetails, error) {
	if s.tmdbAPIKey == "" {
		return nil, fmt.Errorf("TMDB API key not configured")
	}

	params := url.Values{}
	params.Add("api_key", s.tmdbAPIKey)
	params.Add("append_to_response", "credits,external_ids")

	url := fmt.Sprintf("%s/tv/%s?%s", s.tmdbBaseURL, id, params.Encode())

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get TV details: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var tvDetails models.TVDetails
	if err := json.Unmarshal(body, &tvDetails); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Add full image URLs
	if tvDetails.PosterPath != "" {
		tvDetails.PosterPath = s.imageBaseURL + tvDetails.PosterPath
	}
	if tvDetails.BackdropPath != "" {
		tvDetails.BackdropPath = s.imageBaseURL + tvDetails.BackdropPath
	}

	// Add full profile image URLs for cast
	if tvDetails.Credits != nil {
		for i := range tvDetails.Credits.Cast {
			if tvDetails.Credits.Cast[i].ProfilePath != "" {
				tvDetails.Credits.Cast[i].ProfilePath = s.imageBaseURL + tvDetails.Credits.Cast[i].ProfilePath
			}
		}
	}

	// Get additional data from OMDB if IMDB ID is available
	if tvDetails.ExternalIDs != nil && tvDetails.ExternalIDs.IMDBID != "" && s.omdbAPIKey != "" {
		omdbData, err := s.getOMDBData(tvDetails.ExternalIDs.IMDBID)
		if err == nil {
			tvDetails.OMDBData = omdbData
		}
	}

	return &tvDetails, nil
}

// GetTrending gets trending movies and TV shows
func (s *MovieService) GetTrending(timeWindow string) (*models.TrendingResponse, error) {
	if s.tmdbAPIKey == "" {
		return nil, fmt.Errorf("TMDB API key not configured")
	}

	if timeWindow != "day" && timeWindow != "week" {
		timeWindow = "day"
	}

	params := url.Values{}
	params.Add("api_key", s.tmdbAPIKey)

	url := fmt.Sprintf("%s/trending/all/%s?%s", s.tmdbBaseURL, timeWindow, params.Encode())

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get trending: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var trendingResponse models.TrendingResponse
	if err := json.Unmarshal(body, &trendingResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Add full image URLs
	for i := range trendingResponse.Results {
		if trendingResponse.Results[i].PosterPath != "" {
			trendingResponse.Results[i].PosterPath = s.imageBaseURL + trendingResponse.Results[i].PosterPath
		}
		if trendingResponse.Results[i].BackdropPath != "" {
			trendingResponse.Results[i].BackdropPath = s.imageBaseURL + trendingResponse.Results[i].BackdropPath
		}
	}

	return &trendingResponse, nil
}

// GetGenres gets available genres for movies and TV shows
func (s *MovieService) GetGenres() (map[string][]models.Genre, error) {
	if s.tmdbAPIKey == "" {
		return nil, fmt.Errorf("TMDB API key not configured")
	}

	result := make(map[string][]models.Genre)

	// Get movie genres
	movieGenres, err := s.getGenresByType("movie")
	if err != nil {
		return nil, err
	}
	result["movie"] = movieGenres

	// Get TV genres
	tvGenres, err := s.getGenresByType("tv")
	if err != nil {
		return nil, err
	}
	result["tv"] = tvGenres

	return result, nil
}

func (s *MovieService) getGenresByType(mediaType string) ([]models.Genre, error) {
	params := url.Values{}
	params.Add("api_key", s.tmdbAPIKey)

	url := fmt.Sprintf("%s/genre/%s/list?%s", s.tmdbBaseURL, mediaType, params.Encode())

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get %s genres: %w", mediaType, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var genreResponse models.GenreResponse
	if err := json.Unmarshal(body, &genreResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return genreResponse.Genres, nil
}

func (s *MovieService) getOMDBData(imdbID string) (*models.OMDBResponse, error) {
	params := url.Values{}
	params.Add("apikey", s.omdbAPIKey)
	params.Add("i", imdbID)
	params.Add("plot", "full")

	url := fmt.Sprintf("%s/?%s", s.omdbBaseURL, params.Encode())

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get OMDB data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OMDB API request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read OMDB response: %w", err)
	}

	var omdbResponse models.OMDBResponse
	if err := json.Unmarshal(body, &omdbResponse); err != nil {
		return nil, fmt.Errorf("failed to parse OMDB response: %w", err)
	}

	if omdbResponse.Response == "False" {
		return nil, fmt.Errorf("OMDB error: %s", omdbResponse.Error)
	}

	return &omdbResponse, nil
}
