# Movie Discovery App - API Documentation

## Overview

This document describes the REST API endpoints for the Movie Discovery Web Application. The API provides access to movie and TV show data from TMDB (The Movie Database) and OMDB (Open Movie Database).

## Base URL

```
http://localhost:8080/api
```

## Authentication

The API uses server-side API keys for TMDB and OMDB. No client-side authentication is required.

## Endpoints

### 1. Search Movies and TV Shows

**Endpoint:** `GET /api/search`

**Description:** Search for movies and TV shows with optional filtering.

**Parameters:**
- `q` (required): Search query string
- `type` (optional): Content type filter (`multi`, `movie`, `tv`). Default: `multi`
- `page` (optional): Page number for pagination. Default: `1`

**Example Request:**
```
GET /api/search?q=avengers&type=movie&page=1
```

**Example Response:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 24428,
      "title": "The Avengers",
      "overview": "When an unexpected enemy emerges...",
      "poster_path": "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
      "backdrop_path": "https://image.tmdb.org/t/p/w500/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg",
      "release_date": "2012-04-25",
      "vote_average": 7.7,
      "vote_count": 28847,
      "media_type": "movie"
    }
  ],
  "total_pages": 42,
  "total_results": 834
}
```

### 2. Get Movie Details

**Endpoint:** `GET /api/movie/{id}`

**Description:** Get detailed information about a specific movie.

**Parameters:**
- `id` (required): Movie ID from TMDB

**Example Request:**
```
GET /api/movie/24428
```

**Example Response:**
```json
{
  "id": 24428,
  "title": "The Avengers",
  "original_title": "The Avengers",
  "overview": "When an unexpected enemy emerges...",
  "poster_path": "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
  "backdrop_path": "https://image.tmdb.org/t/p/w500/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg",
  "release_date": "2012-04-25",
  "runtime": 143,
  "genres": [
    {
      "id": 878,
      "name": "Science Fiction"
    }
  ],
  "vote_average": 7.7,
  "vote_count": 28847,
  "budget": 220000000,
  "revenue": 1518815515,
  "credits": {
    "cast": [
      {
        "id": 3223,
        "name": "Robert Downey Jr.",
        "character": "Tony Stark / Iron Man",
        "profile_path": "https://image.tmdb.org/t/p/w500/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg"
      }
    ]
  },
  "external_ids": {
    "imdb_id": "tt0848228"
  },
  "omdb_data": {
    "Title": "The Avengers",
    "Year": "2012",
    "Rated": "PG-13",
    "Runtime": "143 min",
    "Genre": "Action, Adventure, Sci-Fi",
    "Director": "Joss Whedon",
    "Ratings": [
      {
        "Source": "Internet Movie Database",
        "Value": "8.0/10"
      },
      {
        "Source": "Rotten Tomatoes",
        "Value": "91%"
      }
    ]
  }
}
```

### 3. Get TV Show Details

**Endpoint:** `GET /api/tv/{id}`

**Description:** Get detailed information about a specific TV show.

**Parameters:**
- `id` (required): TV show ID from TMDB

**Example Request:**
```
GET /api/tv/1399
```

**Example Response:**
```json
{
  "id": 1399,
  "name": "Game of Thrones",
  "original_name": "Game of Thrones",
  "overview": "Seven noble families fight for control...",
  "poster_path": "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
  "backdrop_path": "https://image.tmdb.org/t/p/w500/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
  "first_air_date": "2011-04-17",
  "last_air_date": "2019-05-19",
  "number_of_episodes": 73,
  "number_of_seasons": 8,
  "genres": [
    {
      "id": 10765,
      "name": "Sci-Fi & Fantasy"
    }
  ],
  "vote_average": 8.3,
  "vote_count": 11504,
  "networks": [
    {
      "id": 49,
      "name": "HBO"
    }
  ],
  "created_by": [
    {
      "id": 9813,
      "name": "David Benioff"
    }
  ]
}
```

### 4. Get Trending Content

**Endpoint:** `GET /api/trending`

**Description:** Get trending movies and TV shows.

**Parameters:**
- `time_window` (optional): Time window for trending (`day`, `week`). Default: `day`

**Example Request:**
```
GET /api/trending?time_window=week
```

**Example Response:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 634649,
      "title": "Spider-Man: No Way Home",
      "media_type": "movie",
      "overview": "Peter Parker is unmasked...",
      "poster_path": "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      "vote_average": 8.1,
      "popularity": 6844.503
    }
  ],
  "total_pages": 1000,
  "total_results": 20000
}
```

### 5. Get Genres

**Endpoint:** `GET /api/genres`

**Description:** Get available genres for movies and TV shows.

**Example Request:**
```
GET /api/genres
```

**Example Response:**
```json
{
  "movie": [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 12,
      "name": "Adventure"
    }
  ],
  "tv": [
    {
      "id": 10759,
      "name": "Action & Adventure"
    },
    {
      "id": 16,
      "name": "Animation"
    }
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: Invalid HTTP method
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 50 requests per minute per client
- Rate limit headers are included in responses

## Data Sources

- **TMDB API**: Primary source for movie/TV data, images, and trending content
- **OMDB API**: Additional ratings and detailed plot information

## Image URLs

All image URLs are returned as full URLs with the TMDB image base URL prepended. Images are available in multiple sizes by changing the size parameter in the URL.

## Caching

API responses are cached for 5 minutes to improve performance and reduce external API calls.





