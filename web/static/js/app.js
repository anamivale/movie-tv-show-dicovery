// Main application logic for Movie Discovery App
class MovieDiscoveryApp {
    constructor() {
        this.currentPage = 1;
        this.currentQuery = '';
        this.currentType = 'multi';
        this.currentGenre = '';
        this.genres = {};
        this.init();
    }

    async init() {
        // Initialize theme
        ThemeManager.init();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup search functionality
        this.setupSearch();
        
        // Setup trending tabs
        this.setupTrendingTabs();
        
        // Load initial data
        await this.loadInitialData();
        
        // Setup modal
        this.setupModal();
        
        // Handle URL parameters
        this.handleURLParams();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                e.target.classList.add('active');
                
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const heroSearchInput = document.getElementById('hero-search');
        const heroSearchBtn = document.getElementById('hero-search-btn');
        const contentTypeSelect = document.getElementById('content-type');
        const genreFilter = document.getElementById('genre-filter');

        // Debounced search function
        const debouncedSearch = debounce((query) => {
            if (query.trim()) {
                this.performSearch(query);
            }
        }, 500);

        // Search input event listeners
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
                this.currentPage = 1;
                debouncedSearch(this.currentQuery);
            });
        }

        if (heroSearchInput) {
            heroSearchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
                this.currentPage = 1;
                debouncedSearch(this.currentQuery);
            });

            heroSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                    this.showSection('search');
                }
            });
        }

        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                const query = heroSearchInput.value;
                if (query.trim()) {
                    this.performSearch(query);
                    this.showSection('search');
                }
            });
        }

        // Content type filter
        if (contentTypeSelect) {
            contentTypeSelect.addEventListener('change', (e) => {
                this.currentType = e.target.value;
                this.currentPage = 1;
                if (this.currentQuery) {
                    this.performSearch(this.currentQuery);
                }
            });
        }

        // Genre filter
        if (genreFilter) {
            genreFilter.addEventListener('change', (e) => {
                this.currentGenre = e.target.value;
                this.currentPage = 1;
                if (this.currentQuery) {
                    this.performSearch(this.currentQuery);
                }
            });
        }
    }

    setupTrendingTabs() {
        const tabBtns = document.querySelectorAll('.trending-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                tabBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                const timeWindow = e.target.getAttribute('data-tab');
                this.loadTrending(timeWindow);
            });
        });
    }

    setupModal() {
        const modal = document.getElementById('detail-modal');
        const closeBtn = modal?.querySelector('.close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    async loadInitialData() {
        try {
            // Load genres
            this.genres = await apiService.getGenres();
            this.populateGenreFilter();

        } catch (error) {
            console.error('Failed to load genres:', error);
            // Continue without genres - the app should still work
            this.genres = { movie: [], tv: [] };
        }

        try {
            // Load trending content for home page
            await this.loadTrendingPreview();

        } catch (error) {
            console.error('Failed to load trending preview:', error);
            // The API service will handle demo mode automatically
        }

        // Check if we're in demo mode and show indicator
        if (typeof checkDemoMode === 'function' && checkDemoMode()) {
            this.showDemoModeIndicator();
        }
    }

    populateGenreFilter() {
        const genreFilter = document.getElementById('genre-filter');
        if (!genreFilter || !this.genres) return;

        // Clear existing options except the first one
        genreFilter.innerHTML = '<option value="">All Genres</option>';

        // Combine movie and TV genres, removing duplicates
        const allGenres = new Map();
        
        if (this.genres.movie) {
            this.genres.movie.forEach(genre => allGenres.set(genre.id, genre.name));
        }
        
        if (this.genres.tv) {
            this.genres.tv.forEach(genre => allGenres.set(genre.id, genre.name));
        }

        // Sort genres alphabetically and add to select
        const sortedGenres = Array.from(allGenres.entries()).sort((a, b) => a[1].localeCompare(b[1]));
        
        sortedGenres.forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            genreFilter.appendChild(option);
        });
    }

    async loadTrendingPreview() {
        try {
            const trending = await apiService.getTrending('day');
            this.displayTrendingPreview(trending.results.slice(0, 10)); // Show first 10 items
        } catch (error) {
            console.error('Failed to load trending preview:', error);
        }
    }

    displayTrendingPreview(items) {
        const carousel = document.getElementById('trending-carousel');
        if (!carousel) return;

        carousel.innerHTML = items.map(item => this.createMovieCardHTML(item)).join('');
    }

    showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load section-specific data
            if (sectionId === 'watchlist') {
                watchlistManager.displayWatchlist();
            } else if (sectionId === 'trending') {
                this.loadTrending('day');
            }
        }

        // Update URL
        updateURLParams({ section: sectionId });
    }

    async performSearch(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }

        try {
            this.currentQuery = query;
            const results = await apiService.search(query, this.currentType, this.currentPage);
            
            // Filter by genre if selected
            let filteredResults = results.results;
            if (this.currentGenre) {
                filteredResults = results.results.filter(item => 
                    item.genre_ids && item.genre_ids.includes(parseInt(this.currentGenre))
                );
            }

            this.displaySearchResults(filteredResults, results.total_pages);
            
            // Update search input in search section
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput.value !== query) {
                searchInput.value = query;
            }

            // Update URL
            updateURLParams({ 
                q: query, 
                type: this.currentType, 
                page: this.currentPage,
                genre: this.currentGenre 
            });

        } catch (error) {
            console.error('Search failed:', error);
            this.clearSearchResults();
        }
    }

    displaySearchResults(results, totalPages = 1) {
        const container = document.getElementById('search-results');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
            this.updatePagination(0, 0);
            return;
        }

        container.innerHTML = results.map(item => this.createMovieCardHTML(item)).join('');
        this.updatePagination(this.currentPage, totalPages);
    }

    clearSearchResults() {
        const container = document.getElementById('search-results');
        if (container) {
            container.innerHTML = '';
        }
        this.updatePagination(0, 0);
    }

    createMovieCardHTML(item) {
        const title = getDisplayTitle(item);
        const year = getDisplayYear(getDisplayDate(item));
        const posterUrl = item.poster_path || getPlaceholderImage(200, 300);
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const isInWatchlist = watchlistManager.isInWatchlist(item.id, mediaType);

        return `
            <div class="movie-card" data-id="${item.id}" data-type="${mediaType}" onclick="app.showDetails(${item.id}, '${mediaType}')">
                <img src="${posterUrl}" alt="${sanitizeHTML(title)}" class="movie-poster"
                     onerror="handleImageError(this, 'No Poster')">

                <button class="watchlist-btn ${isInWatchlist ? 'added' : ''}"
                        onclick="event.stopPropagation(); app.toggleWatchlist(${item.id}, '${mediaType}')"
                        title="${isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
                    <i class="fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                </button>

                <div class="movie-info">
                    <h3 class="movie-title">${sanitizeHTML(title)}</h3>
                    ${year ? `<p class="movie-year">${year}</p>` : ''}
                    <div class="movie-rating">
                        <span class="rating-star">★</span>
                        <span>${rating}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updatePagination(currentPage, totalPages) {
        const container = document.getElementById('pagination');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<button onclick="app.goToPage(${currentPage - 1})">Previous</button>`;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button onclick="app.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span>...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<button class="${activeClass}" onclick="app.goToPage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span>...</span>`;
            }
            paginationHTML += `<button onclick="app.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<button onclick="app.goToPage(${currentPage + 1})">Next</button>`;
        }

        container.innerHTML = paginationHTML;
    }

    async goToPage(page) {
        this.currentPage = page;
        if (this.currentQuery) {
            await this.performSearch(this.currentQuery);
        }
        scrollToTop();
    }

    async loadTrending(timeWindow = 'day') {
        try {
            const trending = await apiService.getTrending(timeWindow);
            this.displayTrending(trending.results);
        } catch (error) {
            console.error('Failed to load trending:', error);
            showToast('Failed to load trending content', 'error');
        }
    }

    displayTrending(items) {
        const container = document.getElementById('trending-content');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-fire" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No trending content available</h3>
                    <p>Please try again later</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => this.createMovieCardHTML(item)).join('');
    }

    async showDetails(id, mediaType) {
        try {
            let details;
            if (mediaType === 'movie') {
                details = await apiService.getMovieDetails(id);
            } else {
                details = await apiService.getTVDetails(id);
            }

            this.displayDetails(details, mediaType);
        } catch (error) {
            console.error('Failed to load details:', error);
            showToast('Failed to load details', 'error');
        }
    }

    displayDetails(details, mediaType) {
        const modal = document.getElementById('detail-modal');
        const content = document.getElementById('detail-content');

        if (!modal || !content) return;

        const title = getDisplayTitle(details);
        const year = getDisplayYear(getDisplayDate(details));
        const backdropUrl = details.backdrop_path || details.poster_path || getPlaceholderImage(800, 450);
        const posterUrl = details.poster_path || getPlaceholderImage(300, 450);
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const isInWatchlist = watchlistManager.isInWatchlist(details.id, mediaType);

        // Build genres string
        const genres = details.genres ? details.genres.map(g => g.name).join(', ') : 'Unknown';

        // Build runtime/episodes info
        let runtimeInfo = '';
        if (mediaType === 'movie' && details.runtime) {
            runtimeInfo = formatRuntime(details.runtime);
        } else if (mediaType === 'tv') {
            runtimeInfo = `${details.number_of_seasons || 0} seasons, ${details.number_of_episodes || 0} episodes`;
        }

        content.innerHTML = `
            <div class="detail-header" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${backdropUrl}')">
                <div class="detail-info">
                    <h1 class="detail-title">${sanitizeHTML(title)}</h1>
                    <div class="detail-meta">
                        ${year ? `<span class="detail-year">${year}</span>` : ''}
                        ${runtimeInfo ? `<span class="detail-runtime">${runtimeInfo}</span>` : ''}
                        <span class="detail-rating">★ ${rating}</span>
                        ${details.vote_count ? `<span class="detail-votes">(${formatNumber(details.vote_count)} votes)</span>` : ''}
                    </div>
                    <div class="detail-actions">
                        <button class="btn-primary ${isInWatchlist ? 'added' : ''}"
                                onclick="app.toggleWatchlist(${details.id}, '${mediaType}')">
                            <i class="fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                            ${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        </button>
                        ${this.renderTrailerButton(details)}
                    </div>
                </div>
            </div>

            <div class="detail-body">
                <div class="detail-section">
                    <h3>Overview</h3>
                    <p>${sanitizeHTML(details.overview || 'No overview available.')}</p>
                </div>

                ${genres ? `
                <div class="detail-section">
                    <h3>Genres</h3>
                    <p>${sanitizeHTML(genres)}</p>
                </div>
                ` : ''}

                ${this.renderCast(details.credits)}
                ${this.renderAdditionalInfo(details, mediaType)}
            </div>
        `;

        modal.style.display = 'block';
    }

    renderCast(credits) {
        if (!credits || !credits.cast || credits.cast.length === 0) {
            return '';
        }

        const cast = credits.cast.slice(0, 12); // Show first 12 cast members

        return `
            <div class="detail-section">
                <h3>Cast</h3>
                <div class="cast-grid">
                    ${cast.map(member => `
                        <div class="cast-member">
                            <img src="${member.profile_path || getPlaceholderImage(80, 80, 'No Photo')}"
                                 alt="${sanitizeHTML(member.name)}" class="cast-photo"
                                 onerror="handleImageError(this, 'No Photo')">
                            <div class="cast-name">${sanitizeHTML(member.name)}</div>
                            <div class="cast-character">${sanitizeHTML(member.character || '')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderAdditionalInfo(details, mediaType) {
        let additionalInfo = '';

        // OMDB ratings if available
        if (details.omdb_data && details.omdb_data.Ratings) {
            additionalInfo += `
                <div class="detail-section">
                    <h3>Ratings</h3>
                    <div class="ratings-grid">
                        ${details.omdb_data.Ratings.map(rating => `
                            <div class="rating-item">
                                <strong>${sanitizeHTML(rating.Source)}:</strong> ${sanitizeHTML(rating.Value)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Production info
        if (details.production_companies && details.production_companies.length > 0) {
            const companies = details.production_companies.slice(0, 5).map(c => c.name).join(', ');
            additionalInfo += `
                <div class="detail-section">
                    <h3>Production</h3>
                    <p>${sanitizeHTML(companies)}</p>
                </div>
            `;
        }

        // Movie-specific info
        if (mediaType === 'movie') {
            if (details.budget || details.revenue) {
                additionalInfo += `
                    <div class="detail-section">
                        <h3>Box Office</h3>
                        ${details.budget ? `<p><strong>Budget:</strong> ${formatCurrency(details.budget)}</p>` : ''}
                        ${details.revenue ? `<p><strong>Revenue:</strong> ${formatCurrency(details.revenue)}</p>` : ''}
                    </div>
                `;
            }
        }

        // TV-specific info
        if (mediaType === 'tv') {
            if (details.networks && details.networks.length > 0) {
                const networks = details.networks.map(n => n.name).join(', ');
                additionalInfo += `
                    <div class="detail-section">
                        <h3>Networks</h3>
                        <p>${sanitizeHTML(networks)}</p>
                    </div>
                `;
            }

            if (details.created_by && details.created_by.length > 0) {
                const creators = details.created_by.map(c => c.name).join(', ');
                additionalInfo += `
                    <div class="detail-section">
                        <h3>Created By</h3>
                        <p>${sanitizeHTML(creators)}</p>
                    </div>
                `;
            }
        }

        return additionalInfo;
    }

    renderTrailerButton(details) {
        if (!details.videos || !details.videos.results || details.videos.results.length === 0) {
            return '';
        }

        // Find the best trailer (prefer official trailers from YouTube)
        const trailer = this.findBestTrailer(details.videos.results);
        if (!trailer) {
            return '';
        }

        return `
            <button class="btn-secondary trailer-btn" onclick="app.showTrailer('${trailer.key}', '${trailer.site}', '${sanitizeHTML(trailer.name)}')">
                <i class="fas fa-play"></i>
                Watch Trailer
            </button>
        `;
    }

    findBestTrailer(videos) {
        // Priority: Official trailers > Trailers > Teasers > Other
        const priorities = ['Trailer', 'Teaser', 'Clip', 'Featurette'];

        for (const type of priorities) {
            // First try to find official videos of this type from YouTube
            const officialVideo = videos.find(video =>
                video.type === type &&
                video.official === true &&
                video.site === 'YouTube'
            );
            if (officialVideo) return officialVideo;

            // Then try any video of this type from YouTube
            const youtubeVideo = videos.find(video =>
                video.type === type &&
                video.site === 'YouTube'
            );
            if (youtubeVideo) return youtubeVideo;
        }

        // Fallback to any YouTube video
        return videos.find(video => video.site === 'YouTube') || null;
    }

    showTrailer(videoKey, site, title) {
        if (site !== 'YouTube') {
            showToast('Only YouTube trailers are supported', 'warning');
            return;
        }

        const modal = document.getElementById('trailer-modal');
        const iframe = document.getElementById('trailer-iframe');
        const titleElement = document.getElementById('trailer-title');

        if (!modal || !iframe || !titleElement) {
            // Create trailer modal if it doesn't exist
            this.createTrailerModal();
            return this.showTrailer(videoKey, site, title);
        }

        titleElement.textContent = title;
        iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`;
        modal.style.display = 'block';
    }

    createTrailerModal() {
        const modalHTML = `
            <div id="trailer-modal" class="modal trailer-modal">
                <div class="modal-content trailer-content">
                    <div class="trailer-header">
                        <h3 id="trailer-title">Trailer</h3>
                        <span class="close trailer-close">&times;</span>
                    </div>
                    <div class="trailer-video">
                        <iframe id="trailer-iframe"
                                width="100%"
                                height="100%"
                                frameborder="0"
                                allowfullscreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                        </iframe>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        const modal = document.getElementById('trailer-modal');
        const closeBtn = modal.querySelector('.trailer-close');
        const iframe = document.getElementById('trailer-iframe');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            iframe.src = ''; // Stop video playback
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                iframe.src = ''; // Stop video playback
            }
        });
    }

    toggleWatchlist(id, mediaType) {
        // Find the media item from current results or create a basic one
        let mediaItem = this.findMediaItem(id, mediaType);

        if (!mediaItem) {
            // Create a basic media item if not found
            mediaItem = { id, media_type: mediaType };
        }

        const isInWatchlist = watchlistManager.isInWatchlist(id, mediaType);

        if (isInWatchlist) {
            watchlistManager.removeFromWatchlist(id, mediaType);
        } else {
            watchlistManager.addToWatchlist(mediaItem);
        }

        // Update UI
        this.updateWatchlistButtons(id, mediaType);
    }

    findMediaItem(id, mediaType) {
        // Try to find the item in current search results or trending
        const containers = [
            document.getElementById('search-results'),
            document.getElementById('trending-content'),
            document.getElementById('trending-carousel')
        ];

        for (const container of containers) {
            if (container) {
                const card = container.querySelector(`[data-id="${id}"][data-type="${mediaType}"]`);
                if (card) {
                    // Extract data from the card or return a basic item
                    const title = card.querySelector('.movie-title')?.textContent || '';
                    const year = card.querySelector('.movie-year')?.textContent || '';
                    const poster = card.querySelector('.movie-poster')?.src || '';

                    return {
                        id: parseInt(id),
                        title: title,
                        name: title,
                        poster_path: poster,
                        release_date: year,
                        first_air_date: year,
                        media_type: mediaType,
                        vote_average: 0,
                        overview: ''
                    };
                }
            }
        }

        return null;
    }

    updateWatchlistButtons(id, mediaType) {
        const isInWatchlist = watchlistManager.isInWatchlist(id, mediaType);
        const buttons = document.querySelectorAll(`[data-id="${id}"][data-type="${mediaType}"] .watchlist-btn`);

        buttons.forEach(btn => {
            btn.classList.toggle('added', isInWatchlist);
            btn.title = isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist';

            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = `fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}`;
            }
        });

        // Update modal button if open
        const modalBtn = document.querySelector('#detail-modal .btn-primary');
        if (modalBtn && modalBtn.onclick && modalBtn.onclick.toString().includes(`${id}, '${mediaType}'`)) {
            modalBtn.classList.toggle('added', isInWatchlist);
            modalBtn.innerHTML = `
                <i class="fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                ${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            `;
        }
    }

    handleURLParams() {
        const query = getURLParam('q');
        const section = getURLParam('section', 'home');
        const type = getURLParam('type', 'multi');
        const page = parseInt(getURLParam('page', '1'));
        const genre = getURLParam('genre', '');

        // Set current values
        this.currentQuery = query || '';
        this.currentType = type;
        this.currentPage = page;
        this.currentGenre = genre;

        // Update UI elements
        const searchInput = document.getElementById('search-input');
        const heroSearchInput = document.getElementById('hero-search');
        const contentTypeSelect = document.getElementById('content-type');
        const genreFilter = document.getElementById('genre-filter');

        if (searchInput && query) searchInput.value = query;
        if (heroSearchInput && query) heroSearchInput.value = query;
        if (contentTypeSelect) contentTypeSelect.value = type;
        if (genreFilter) genreFilter.value = genre;

        // Show appropriate section
        this.showSection(section);

        // Perform search if query exists
        if (query) {
            this.performSearch(query);
        }
    }

    showDemoModeIndicator() {
        // Add demo mode indicator to the page
        const indicator = document.createElement('div');
        indicator.className = 'demo-mode-indicator';
        indicator.innerHTML = `
            <div class="demo-content">
                <i class="fas fa-info-circle"></i>
                <span>Demo Mode: Using sample data. Add API keys for full functionality.</span>
                <button onclick="this.parentElement.parentElement.remove()" class="demo-close">×</button>
            </div>
        `;

        document.body.appendChild(indicator);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.remove();
            }
        }, 10000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MovieDiscoveryApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MovieDiscoveryApp };
}
