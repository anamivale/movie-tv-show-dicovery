package models

// SearchResponse represents the response from search API
type SearchResponse struct {
	Page         int     `json:"page"`
	Results      []Media `json:"results"`
	TotalPages   int     `json:"total_pages"`
	TotalResults int     `json:"total_results"`
}

// Media represents a movie or TV show in search results
type Media struct {
	ID               int     `json:"id"`
	Title            string  `json:"title,omitempty"`          // For movies
	Name             string  `json:"name,omitempty"`           // For TV shows
	OriginalTitle    string  `json:"original_title,omitempty"` // For movies
	OriginalName     string  `json:"original_name,omitempty"`  // For TV shows
	Overview         string  `json:"overview"`
	PosterPath       string  `json:"poster_path"`
	BackdropPath     string  `json:"backdrop_path"`
	ReleaseDate      string  `json:"release_date,omitempty"`   // For movies
	FirstAirDate     string  `json:"first_air_date,omitempty"` // For TV shows
	GenreIDs         []int   `json:"genre_ids"`
	VoteAverage      float64 `json:"vote_average"`
	VoteCount        int     `json:"vote_count"`
	Popularity       float64 `json:"popularity"`
	Adult            bool    `json:"adult"`
	Video            bool    `json:"video,omitempty"` // For movies
	OriginalLanguage string  `json:"original_language"`
	MediaType        string  `json:"media_type,omitempty"` // "movie" or "tv"
}

// MovieDetails represents detailed information about a movie
type MovieDetails struct {
	ID                  int                 `json:"id"`
	Title               string              `json:"title"`
	OriginalTitle       string              `json:"original_title"`
	Overview            string              `json:"overview"`
	PosterPath          string              `json:"poster_path"`
	BackdropPath        string              `json:"backdrop_path"`
	ReleaseDate         string              `json:"release_date"`
	Runtime             int                 `json:"runtime"`
	Genres              []Genre             `json:"genres"`
	VoteAverage         float64             `json:"vote_average"`
	VoteCount           int                 `json:"vote_count"`
	Popularity          float64             `json:"popularity"`
	Budget              int64               `json:"budget"`
	Revenue             int64               `json:"revenue"`
	Status              string              `json:"status"`
	Tagline             string              `json:"tagline"`
	Adult               bool                `json:"adult"`
	Video               bool                `json:"video"`
	OriginalLanguage    string              `json:"original_language"`
	SpokenLanguages     []SpokenLanguage    `json:"spoken_languages"`
	ProductionCompanies []ProductionCompany `json:"production_companies"`
	ProductionCountries []ProductionCountry `json:"production_countries"`
	Credits             *Credits            `json:"credits,omitempty"`
	ExternalIDs         *ExternalIDs        `json:"external_ids,omitempty"`
	OMDBData            *OMDBResponse       `json:"omdb_data,omitempty"`
}

// TVDetails represents detailed information about a TV show
type TVDetails struct {
	ID                  int                 `json:"id"`
	Name                string              `json:"name"`
	OriginalName        string              `json:"original_name"`
	Overview            string              `json:"overview"`
	PosterPath          string              `json:"poster_path"`
	BackdropPath        string              `json:"backdrop_path"`
	FirstAirDate        string              `json:"first_air_date"`
	LastAirDate         string              `json:"last_air_date"`
	NumberOfEpisodes    int                 `json:"number_of_episodes"`
	NumberOfSeasons     int                 `json:"number_of_seasons"`
	Genres              []Genre             `json:"genres"`
	VoteAverage         float64             `json:"vote_average"`
	VoteCount           int                 `json:"vote_count"`
	Popularity          float64             `json:"popularity"`
	Status              string              `json:"status"`
	Type                string              `json:"type"`
	OriginalLanguage    string              `json:"original_language"`
	SpokenLanguages     []SpokenLanguage    `json:"spoken_languages"`
	ProductionCompanies []ProductionCompany `json:"production_companies"`
	ProductionCountries []ProductionCountry `json:"production_countries"`
	Networks            []Network           `json:"networks"`
	CreatedBy           []Creator           `json:"created_by"`
	Seasons             []Season            `json:"seasons"`
	Credits             *Credits            `json:"credits,omitempty"`
	ExternalIDs         *ExternalIDs        `json:"external_ids,omitempty"`
	OMDBData            *OMDBResponse       `json:"omdb_data,omitempty"`
}

// Genre represents a movie/TV genre
type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Credits represents cast and crew information
type Credits struct {
	Cast []CastMember `json:"cast"`
	Crew []CrewMember `json:"crew"`
}

// CastMember represents an actor in the cast
type CastMember struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Character    string `json:"character"`
	ProfilePath  string `json:"profile_path"`
	Order        int    `json:"order"`
	CreditID     string `json:"credit_id"`
	Gender       int    `json:"gender"`
	KnownForDept string `json:"known_for_department"`
}

// CrewMember represents a crew member
type CrewMember struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Job          string `json:"job"`
	Department   string `json:"department"`
	ProfilePath  string `json:"profile_path"`
	CreditID     string `json:"credit_id"`
	Gender       int    `json:"gender"`
	KnownForDept string `json:"known_for_department"`
}

// ExternalIDs represents external database IDs
type ExternalIDs struct {
	IMDBID      string `json:"imdb_id"`
	FacebookID  string `json:"facebook_id"`
	InstagramID string `json:"instagram_id"`
	TwitterID   string `json:"twitter_id"`
}

// SpokenLanguage represents a spoken language
type SpokenLanguage struct {
	ISO6391     string `json:"iso_639_1"`
	Name        string `json:"name"`
	EnglishName string `json:"english_name"`
}

// ProductionCompany represents a production company
type ProductionCompany struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	LogoPath      string `json:"logo_path"`
	OriginCountry string `json:"origin_country"`
}

// ProductionCountry represents a production country
type ProductionCountry struct {
	ISO31661 string `json:"iso_3166_1"`
	Name     string `json:"name"`
}

// Network represents a TV network
type Network struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	LogoPath      string `json:"logo_path"`
	OriginCountry string `json:"origin_country"`
}

// Creator represents a TV show creator
type Creator struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	ProfilePath string `json:"profile_path"`
	CreditID    string `json:"credit_id"`
	Gender      int    `json:"gender"`
}

// Season represents a TV show season
type Season struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Overview     string `json:"overview"`
	PosterPath   string `json:"poster_path"`
	SeasonNumber int    `json:"season_number"`
	EpisodeCount int    `json:"episode_count"`
	AirDate      string `json:"air_date"`
}

// TrendingResponse represents trending content response
type TrendingResponse struct {
	Page         int     `json:"page"`
	Results      []Media `json:"results"`
	TotalPages   int     `json:"total_pages"`
	TotalResults int     `json:"total_results"`
}

// GenreResponse represents the genres API response
type GenreResponse struct {
	Genres []Genre `json:"genres"`
}

// OMDBResponse represents response from OMDB API
type OMDBResponse struct {
	Title    string `json:"Title"`
	Year     string `json:"Year"`
	Rated    string `json:"Rated"`
	Released string `json:"Released"`
	Runtime  string `json:"Runtime"`
	Genre    string `json:"Genre"`
	Director string `json:"Director"`
	Writer   string `json:"Writer"`
	Actors   string `json:"Actors"`
	Plot     string `json:"Plot"`
	Language string `json:"Language"`
	Country  string `json:"Country"`
	Awards   string `json:"Awards"`
	Poster   string `json:"Poster"`
	Ratings  []struct {
		Source string `json:"Source"`
		Value  string `json:"Value"`
	} `json:"Ratings"`
	Metascore    string `json:"Metascore"`
	IMDBRating   string `json:"imdbRating"`
	IMDBVotes    string `json:"imdbVotes"`
	IMDBID       string `json:"imdbID"`
	Type         string `json:"Type"`
	TotalSeasons string `json:"totalSeasons,omitempty"`
	Response     string `json:"Response"`
	Error        string `json:"Error,omitempty"`
}
