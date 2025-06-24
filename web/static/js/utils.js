// Utility functions for the movie discovery app

// Show/hide loading spinner
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Show toast notifications
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()"
                    aria-label="Close notification" title="Close">×</button>
        </div>
    `;

    container.appendChild(toast);

    // Focus management for accessibility
    if (type === 'error') {
        toast.setAttribute('aria-live', 'assertive');
        toast.focus();
    }

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

// Format date string
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Format runtime in minutes to hours and minutes
function formatRuntime(minutes) {
    if (!minutes || minutes === 0) return 'Unknown';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins}m`;
    } else if (mins === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${mins}m`;
    }
}

// Format vote average to stars
function formatRating(rating, maxStars = 5) {
    if (!rating) return '☆☆☆☆☆';
    
    const stars = Math.round((rating / 10) * maxStars);
    const fullStars = '★'.repeat(stars);
    const emptyStars = '☆'.repeat(maxStars - stars);
    
    return fullStars + emptyStars;
}

// Format large numbers (e.g., vote count, budget)
function formatNumber(num) {
    if (!num || num === 0) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toString();
}

// Format currency
function formatCurrency(amount) {
    if (!amount || amount === 0) return 'Unknown';
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Get display title for media (handles both movies and TV shows)
function getDisplayTitle(media) {
    return media.title || media.name || 'Unknown Title';
}

// Get display date for media (handles both movies and TV shows)
function getDisplayDate(media) {
    return media.release_date || media.first_air_date || '';
}

// Get display year from date string
function getDisplayYear(dateString) {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
}

// Truncate text to specified length
function truncateText(text, maxLength = 150) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Create placeholder image URL
function getPlaceholderImage(width = 500, height = 750, text = 'No Image') {
    return `data:image/svg+xml;base64,${btoa(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#2f2f2f"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
                  fill="#b3b3b3" text-anchor="middle" dominant-baseline="middle">
                ${text}
            </text>
        </svg>
    `)}`;
}

// Handle image loading errors
function handleImageError(img, fallbackText = 'No Image') {
    img.src = getPlaceholderImage(img.width || 500, img.height || 750, fallbackText);
    img.onerror = null; // Prevent infinite loop
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Local storage helpers
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Theme management
const ThemeManager = {
    init() {
        const savedTheme = Storage.get('theme', 'dark');
        this.setTheme(savedTheme);
        
        const themeToggle = document.getElementById('theme-icon');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.set('theme', theme);

        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            // Show sun icon in dark mode (to switch to light), moon icon in light mode (to switch to dark)
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }
};

// Scroll utilities
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// URL utilities
function updateURLParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

function getURLParam(param, defaultValue = null) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || defaultValue;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading,
        showToast,
        formatDate,
        formatRuntime,
        formatRating,
        formatNumber,
        formatCurrency,
        getDisplayTitle,
        getDisplayDate,
        getDisplayYear,
        truncateText,
        getPlaceholderImage,
        handleImageError,
        sanitizeHTML,
        Storage,
        ThemeManager,
        scrollToTop,
        isElementInViewport,
        updateURLParams,
        getURLParam
    };
}
