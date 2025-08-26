// js/script.js

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load from JSON file
    loadProjectsFromJSON();
});

function loadProjectsFromJSON() {
    fetch('../data/projects.json')  // Adjusted path - try this first
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(projectsData => {
            initializeWithData(projectsData);
        })
        .catch(error => {
            console.error('Error loading projects from JSON:', error);
            // Try alternative path if the first one fails
            console.log('Trying alternative path...');
            fetch('data/projects.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(projectsData => {
                    initializeWithData(projectsData);
                })
                .catch(error => {
                    console.error('Error loading projects from alternative path:', error);
                    // Fallback to empty array with error message
                    const container = document.getElementById('projects-container');
                    container.innerHTML = `
                        <div class="empty-state">
                            <h3>Error Loading Projects</h3>
                            <p>Could not load projects from JSON file. Please check the file path and format.</p>
                            <p>Error details: ${error.message}</p>
                        </div>
                    `;
                });
        });
}

function initializeWithData(projectsData) {
    // Extract all unique categories and types from projects
    const allCategories = [...new Set(projectsData.flatMap(project => project.categories))];
    const allTypes = [...new Set(projectsData.flatMap(project => project.types))];
    
    // Populate category filters
    const categoryFilters = document.getElementById('category-filters');
    allCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.textContent = category;
        button.setAttribute('data-filter', category);
        button.setAttribute('data-group', 'category');
        categoryFilters.appendChild(button);
    });
    
    // Populate type filters
    const typeFilters = document.getElementById('type-filters');
    allTypes.forEach(type => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.textContent = type;
        button.setAttribute('data-filter', type);
        button.setAttribute('data-group', 'type');
        typeFilters.appendChild(button);
    });
    
    // Check URL for existing filters and apply them
    applyFiltersFromURL(projectsData);
    
    // Set up filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Handle active state for filter group
            const group = this.parentElement;
            group.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            applyFilters(projectsData);
        });
    });
    
    // Set up search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => applyFilters(projectsData));
    
}

function applyFiltersFromURL(projectsData) {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get category filter from URL
    const categoryFromURL = urlParams.get('category');
    if (categoryFromURL) {
        const categoryButton = document.querySelector(`#category-filters .filter-btn[data-filter="${categoryFromURL}"]`);
        if (categoryButton) {
            document.querySelectorAll('#category-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
            categoryButton.classList.add('active');
        }
    }
    
    // Get type filter from URL
    const typeFromURL = urlParams.get('type');
    if (typeFromURL) {
        const typeButton = document.querySelector(`#type-filters .filter-btn[data-filter="${typeFromURL}"]`);
        if (typeButton) {
            document.querySelectorAll('#type-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
            typeButton.classList.add('active');
        }
    }
    
    // Get search term from URL
    const searchFromURL = urlParams.get('search');
    if (searchFromURL) {
        const searchInput = document.getElementById('search-input');
        searchInput.value = searchFromURL;
    }
    
    // Apply filters with the URL parameters
    applyFilters(projectsData);
}

function applyFilters(projectsData) {
    // Get active category filter
    const activeCategory = document.querySelector('#category-filters .filter-btn.active').getAttribute('data-filter');
    
    // Get active type filter
    const activeType = document.querySelector('#type-filters .filter-btn.active').getAttribute('data-filter');
    
    // Get search term
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    // Update URL with current filters
    updateURLWithFilters(activeCategory, activeType, searchTerm);
    
    // Filter projects
    const filteredProjects = projectsData.filter(project => {
        // Category filter
        const categoryMatch = activeCategory === 'all' || project.categories.includes(activeCategory);
        
        // Type filter
        const typeMatch = activeType === 'all' || project.types.includes(activeType);
        
        // Search filter
        const searchMatch = 
            project.title.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm) ||
            project.categories.some(cat => cat.toLowerCase().includes(searchTerm)) ||
            project.types.some(type => type.toLowerCase().includes(searchTerm));
        
        return categoryMatch && typeMatch && searchMatch;
    });
    
    renderProjects(filteredProjects);
}

function updateURLWithFilters(category, type, search) {
    const urlParams = new URLSearchParams();
    
    // Only add to URL if not default values
    if (category && category !== 'all') {
        urlParams.set('category', category);
    }
    
    if (type && type !== 'all') {
        urlParams.set('type', type);
    }
    
    if (search) {
        urlParams.set('search', search);
    }
    
    // Update URL without reloading the page
    const newURL = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}


function renderProjects(projectsToRender) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (projectsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No projects found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>
        `;
        return;
    }
    
    projectsToRender.forEach(project => {
        const projectEl = document.createElement('div');
        projectEl.className = 'project-card';
        
        projectEl.innerHTML = `
            <div class="project-image" style="background-image: url('${project.image || 'https://placehold.co/600x400/333333/ffffff?text=No+Image'}')"></div>
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    ${project.categories.map(cat => `<span class="project-tag">${cat}</span>`).join('')}
                    ${project.types.map(type => `<span class="project-tag">${type}</span>`).join('')}
                </div>
                <a href="${project.link}" target="_blank" class="project-link">${project.link}</a>
            </div>
        `;
        
        container.appendChild(projectEl);
    });
}