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
            showToast('Failed to fetch data. Please try again.', 'error');
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

        const params = new URLSearchParams({
            q: query.trim(),
            type: type,
            page: page.toString()
        });

        const url = `/api/search?${params.toString()}`;
        return await this.makeRequest(url);
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
        const url = `/api/trending?time_window=${timeWindow}`;
        return await this.makeRequest(url);
    }

    // Get genres
    async getGenres() {
        const url = '/api/genres';
        return await this.makeRequest(url);
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
