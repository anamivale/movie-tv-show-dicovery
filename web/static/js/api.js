// API service for handling all API calls
class APIService {
    constructor() {
        this.baseURL = '';
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }

    // Generic method to make API calls with caching
    async makeRequest(url, options = {}) {
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }

        try {
            showLoading(true);
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('API request failed:', error);

            // Check if it's an API key configuration error
            if (error.message.includes('500') && url.includes('/api/')) {
                showToast('API keys not configured. Using demo mode with sample data.', 'warning');
                enableDemoMode();
            } else if (error.message.includes('TMDB API key not configured')) {
                showToast('TMDB API key not configured. Please add your API key to the .env file.', 'warning');
                enableDemoMode();
            } else {
                showToast('Failed to fetch data. Please try again.', 'error');
            }
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Search for movies and TV shows
    async search(query, type = 'multi', page = 1) {
        if (!query.trim()) {
            return { results: [], total_pages: 0, total_results: 0 };
        }

        try {
            const params = new URLSearchParams({
                q: query.trim(),
                type: type,
                page: page.toString()
            });

            const url = `/api/search?${params.toString()}`;
            return await this.makeRequest(url);
        } catch (error) {
            // If API fails, return demo data filtered by query
            if (typeof DEMO_DATA !== 'undefined' && checkDemoMode()) {
                console.log('Search API failed, using demo data');
                const filteredResults = DEMO_DATA.trending.results.filter(item => {
                    const title = item.title || item.name || '';
                    return title.toLowerCase().includes(query.toLowerCase());
                });
                return {
                    results: filteredResults,
                    total_pages: 1,
                    total_results: filteredResults.length,
                    page: 1
                };
            }
            throw error;
        }
    }

    // Get movie details
    async getMovieDetails(id) {
        const url = `/api/movie/${id}`;
        return await this.makeRequest(url);
    }

    // Get TV show details
    async getTVDetails(id) {
        const url = `/api/tv/${id}`;
        return await this.makeRequest(url);
    }

    // Get trending content
    async getTrending(timeWindow = 'day') {
        try {
            const url = `/api/trending?time_window=${timeWindow}`;
            return await this.makeRequest(url);
        } catch (error) {
            // Return demo data if API fails
            if (typeof DEMO_DATA !== 'undefined') {
                console.log('API failed, switching to demo mode for trending content');
                enableDemoMode();
                return DEMO_DATA.trending;
            }
            throw error;
        }
    }

    // Get genres
    async getGenres() {
        try {
            const url = '/api/genres';
            return await this.makeRequest(url);
        } catch (error) {
            // Enable demo mode and return demo data
            if (typeof enableDemoMode === 'function' && typeof DEMO_DATA !== 'undefined') {
                console.log('API failed, switching to demo mode for genres');
                enableDemoMode();
                return DEMO_DATA.genres;
            }
            throw error;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache size for debugging
    getCacheSize() {
        return this.cache.size;
    }
}

// Create global API service instance
const apiService = new APIService();

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Rate limiting helper
class RateLimiter {
    constructor(maxRequests = 10, windowMs = 1000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        
        this.requests.push(now);
        return true;
    }

    getWaitTime() {
        if (this.requests.length === 0) return 0;
        const oldestRequest = Math.min(...this.requests);
        return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
    }
}

// Create global rate limiter
const rateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

// Enhanced API service with rate limiting
const originalMakeRequest = APIService.prototype.makeRequest;
APIService.prototype.makeRequest = async function(url, options = {}) {
    if (!rateLimiter.canMakeRequest()) {
        const waitTime = rateLimiter.getWaitTime();
        showToast(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`, 'warning');
        throw new Error('Rate limit exceeded');
    }
    
    return originalMakeRequest.call(this, url, options);
};

// Error handling for network issues
window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showToast('Connection lost. Some features may not work.', 'warning');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, debounce, RateLimiter };
}
