# movie-tv-show-discovery

A comprehensive entertainment discovery platform built with Go backend and vanilla JavaScript frontend.

## Tech Stack

- **Backend**: Go (Golang)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **APIs**: TMDB API, OMDB API
- **Storage**: localStorage for user preferences


## Setup Instructions

### Prerequisites
- Go 1.19 or higher
- Modern web browser
- Internet connection for API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anamivale/movie-tv-show-discovery.git
   cd movie-tv-show-discovery
   ```

2. **Get API Keys**
   - **TMDB API Key**:
     - Go to https://www.themoviedb.org/settings/api
     - Create an account and request an API key
     - Copy your API key

   - **OMDB API Key**:
     - Go to http://www.omdbapi.com/apikey.aspx
     - Request a free API key
     - Copy your API key

3. **Configure Environment Variables**
   ```bash
   cd configs
   cp .env.example .env
   ```
   Edit `.env` and replace the placeholder values:
   ```
   TMDB_API_KEY=your_actual_tmdb_api_key_here
   OMDB_API_KEY=your_actual_omdb_api_key_here
   PORT=8080
   ```

4. **Install Dependencies**
   ```bash
   go mod tidy
   ```

5. **Run the Application**
   ```bash
   go run cmd/server/main.go
   ```

6. **Access the Application**
   Open your browser and navigate to: http://localhost:8080