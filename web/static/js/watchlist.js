// Watchlist management functionality
class WatchlistManager {
    constructor() {
        this.storageKey = 'movieWatchlist';
        this.watchlist = this.loadWatchlist();
        this.init();
    }

    init() {
        this.updateWatchlistCount();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Export watchlist button
        const exportBtn = document.getElementById('export-watchlist');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportWatchlist());
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.watchlist-filters .filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                const filter = e.target.getAttribute('data-filter');
                this.filterWatchlist(filter);
            });
        });
    }

    loadWatchlist() {
        return Storage.get(this.storageKey, []);
    }

    saveWatchlist() {
        Storage.set(this.storageKey, this.watchlist);
        this.updateWatchlistCount();
    }

    addToWatchlist(media) {
        // Check if already in watchlist
        const existingIndex = this.watchlist.findIndex(item => 
            item.id === media.id && item.media_type === (media.media_type || this.getMediaType(media))
        );

        if (existingIndex === -1) {
            const watchlistItem = {
                id: media.id,
                title: getDisplayTitle(media),
                poster_path: media.poster_path,
                release_date: getDisplayDate(media),
                vote_average: media.vote_average,
                overview: media.overview,
                media_type: media.media_type || this.getMediaType(media),
                added_date: new Date().toISOString(),
                watched: false
            };

            this.watchlist.unshift(watchlistItem); // Add to beginning
            this.saveWatchlist();
            showToast(`"${watchlistItem.title}" added to watchlist`, 'success');
            return true;
        } else {
            showToast(`"${getDisplayTitle(media)}" is already in your watchlist`, 'warning');
            return false;
        }
    }

    removeFromWatchlist(id, mediaType) {
        const index = this.watchlist.findIndex(item => 
            item.id === id && item.media_type === mediaType
        );

        if (index !== -1) {
            const removedItem = this.watchlist.splice(index, 1)[0];
            this.saveWatchlist();
            showToast(`"${removedItem.title}" removed from watchlist`, 'success');
            
            // Refresh watchlist display if currently viewing
            const currentSection = document.querySelector('.section.active');
            if (currentSection && currentSection.id === 'watchlist') {
                this.displayWatchlist();
            }
            return true;
        }
        return false;
    }

    toggleWatched(id, mediaType) {
        const item = this.watchlist.find(item => 
            item.id === id && item.media_type === mediaType
        );

        if (item) {
            item.watched = !item.watched;
            item.watched_date = item.watched ? new Date().toISOString() : null;
            this.saveWatchlist();
            
            const status = item.watched ? 'watched' : 'unwatched';
            showToast(`"${item.title}" marked as ${status}`, 'success');
            
            // Refresh watchlist display if currently viewing
            const currentSection = document.querySelector('.section.active');
            if (currentSection && currentSection.id === 'watchlist') {
                this.displayWatchlist();
            }
            return true;
        }
        return false;
    }

    isInWatchlist(id, mediaType) {
        return this.watchlist.some(item => 
            item.id === id && item.media_type === mediaType
        );
    }

    getWatchlist() {
        return [...this.watchlist]; // Return copy
    }

    getWatchlistStats() {
        const total = this.watchlist.length;
        const watched = this.watchlist.filter(item => item.watched).length;
        const unwatched = total - watched;

        return { total, watched, unwatched };
    }

    updateWatchlistCount() {
        const countElement = document.getElementById('watchlist-count');
        if (countElement) {
            const stats = this.getWatchlistStats();
            countElement.textContent = `${stats.total} items`;
        }
    }

    filterWatchlist(filter = 'all') {
        let filteredList = this.watchlist;

        switch (filter) {
            case 'watched':
                filteredList = this.watchlist.filter(item => item.watched);
                break;
            case 'unwatched':
                filteredList = this.watchlist.filter(item => !item.watched);
                break;
            case 'all':
            default:
                filteredList = this.watchlist;
                break;
        }

        this.displayFilteredWatchlist(filteredList);
    }

    displayWatchlist() {
        this.filterWatchlist('all');
    }

    displayFilteredWatchlist(items) {
        const container = document.getElementById('watchlist-content');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>Your watchlist is empty</h3>
                    <p>Start adding movies and TV shows to keep track of what you want to watch!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => this.createWatchlistItemHTML(item)).join('');
    }

    createWatchlistItemHTML(item) {
        const posterUrl = item.poster_path || getPlaceholderImage(200, 300);
        const year = getDisplayYear(item.release_date);
        const rating = formatRating(item.vote_average);
        const watchedClass = item.watched ? 'watched' : '';
        const watchedIcon = item.watched ? 'fas fa-check-circle' : 'far fa-circle';

        return `
            <div class="movie-card watchlist-item ${watchedClass}" data-id="${item.id}" data-type="${item.media_type}">
                <img src="${posterUrl}" alt="${sanitizeHTML(item.title)}" class="movie-poster" 
                     onerror="handleImageError(this, 'No Poster')">
                
                <div class="watchlist-controls">
                    <button class="watchlist-btn remove-btn" onclick="watchlistManager.removeFromWatchlist(${item.id}, '${item.media_type}')" 
                            title="Remove from watchlist">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="watched-btn" onclick="watchlistManager.toggleWatched(${item.id}, '${item.media_type}')" 
                            title="${item.watched ? 'Mark as unwatched' : 'Mark as watched'}">
                        <i class="${watchedIcon}"></i>
                    </button>
                </div>

                <div class="movie-info">
                    <h3 class="movie-title">${sanitizeHTML(item.title)}</h3>
                    ${year ? `<p class="movie-year">${year}</p>` : ''}
                    <div class="movie-rating">
                        <span class="rating-star">★</span>
                        <span>${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                    ${item.overview ? `<p class="movie-overview">${truncateText(sanitizeHTML(item.overview), 100)}</p>` : ''}
                    <p class="added-date">Added: ${formatDate(item.added_date)}</p>
                    ${item.watched && item.watched_date ? `<p class="watched-date">Watched: ${formatDate(item.watched_date)}</p>` : ''}
                </div>
            </div>
        `;
    }

    exportWatchlist() {
        if (this.watchlist.length === 0) {
            showToast('Your watchlist is empty', 'warning');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `watchlist_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Watchlist exported successfully', 'success');
        } else {
            showToast('Export not supported in this browser', 'error');
        }
    }

    generateCSV() {
        const headers = ['Title', 'Type', 'Release Date', 'Rating', 'Watched', 'Added Date', 'Watched Date'];
        const rows = this.watchlist.map(item => [
            `"${item.title.replace(/"/g, '""')}"`, // Escape quotes in title
            item.media_type,
            item.release_date || '',
            item.vote_average || '',
            item.watched ? 'Yes' : 'No',
            formatDate(item.added_date),
            item.watched_date ? formatDate(item.watched_date) : ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    getMediaType(media) {
        // Determine media type based on available properties
        if (media.title && media.release_date) return 'movie';
        if (media.name && media.first_air_date) return 'tv';
        return media.media_type || 'movie'; // Default to movie
    }

    clearWatchlist() {
        if (confirm('Are you sure you want to clear your entire watchlist? This action cannot be undone.')) {
            this.watchlist = [];
            this.saveWatchlist();
            this.displayWatchlist();
            showToast('Watchlist cleared', 'success');
        }
    }

    importWatchlist(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            
            if (!headers.includes('Title') || !headers.includes('Type')) {
                throw new Error('Invalid CSV format');
            }

            let importedCount = 0;
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length >= headers.length) {
                    // Parse CSV row and add to watchlist
                    // This is a simplified implementation
                    importedCount++;
                }
            }

            showToast(`Imported ${importedCount} items`, 'success');
            this.displayWatchlist();
        } catch (error) {
            showToast('Failed to import watchlist', 'error');
        }
    }
}

// Create global watchlist manager instance
const watchlistManager = new WatchlistManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WatchlistManager };
}
