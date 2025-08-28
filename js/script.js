// js/script.js

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load from JSON file
        window.themeSystem.initialize(); // or initializeSmart() for less random
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

const themes = {
            tavern: {
                '--theme-bg-primary': '#f5f2e8',
                '--theme-bg-secondary': '#e8e2d2',
                '--theme-text-primary': '#2c1c0f',
                '--theme-text-secondary': '#543c2eff',
                '--theme-accent': '#b52f2fff',
                '--theme-accent-hover': '#6d4621',
                '--theme-border': '#8B5A2B',
                '--theme-shadow': '#3B1E14',
                '--theme-card-bg': '#f9f6ef',
                '--theme-filter-bg': '#e8d9c5',
                '--theme-filter-hover': '#d8c5a8',
                '--theme-tag-bg': '#d8c5a8',
                '--theme-scan-opacity': '0.15'
            },
            
            cyber: {
                '--theme-bg-primary': '#0a0a12',
                '--theme-bg-secondary': '#161627',
                '--theme-text-primary': '#ffffff',
                '--theme-text-secondary': '#c8d1e0',
                '--theme-accent': '#0CDEAD',
                '--theme-accent-hover': '#09b892',
                '--theme-border': '#324461',
                '--theme-shadow': '#000',
                '--theme-card-bg': '#1a1a2e',
                '--theme-filter-bg': '#47476eff',
                '--theme-filter-hover': '#323262',
                '--theme-tag-bg': '#2a2a4a',
                '--theme-scan-opacity': '0.4'
            },
            
ocean: {
    '--theme-bg-primary': '#b2fefa',  // brighter aqua
    '--theme-bg-secondary': '#4facfe', // gradient-like deep aqua
    '--theme-text-primary': '#002a24', // dark teal for max contrast
    '--theme-text-secondary': '#004d40', 
    '--theme-accent': '#bf00a6ff', // neon teal
    '--theme-accent-hover': '#00897b',
    '--theme-border': '#00695c',
    '--theme-shadow': 'rgba(0, 89, 80, 0.6)', // glowing shadow
    '--theme-card-bg': '#deeefbff',
    '--theme-filter-bg': '#80cbc4',
    '--theme-filter-hover': '#4db6ac',
    '--theme-tag-bg': '#4db6ac',
    '--theme-scan-opacity': '0.3'
},

mystic: {
    '--theme-bg-primary': '#f8e1ff', // lighter lilac
    '--theme-bg-secondary': '#d884ff', // vivid purple
    '--theme-text-primary': '#2a0035', // very dark purple
    '--theme-text-secondary': '#4a148c',
    '--theme-accent': '#11853cff', // electric violet
    '--theme-accent-hover': '#9c27b0',
    '--theme-border': '#6a1b9a',
    '--theme-shadow': 'rgba(0, 130, 104, 0.6)',
    '--theme-card-bg': '#e7e0faff',
    '--theme-filter-bg': '#d1c4e9',
    '--theme-filter-hover': '#b39ddb',
    '--theme-tag-bg': '#ce93d8',
    '--theme-scan-opacity': '0.35'
},

forest: {
    '--theme-bg-primary': '#d6f5d6', // vivid spring green tone
    '--theme-bg-secondary': '#76d275', // more saturated leaf green
    '--theme-text-primary': '#122b12', 
    '--theme-text-secondary': '#1b5e20',
    '--theme-accent': '#b500ff', // richer green
    '--theme-accent-hover': '#2e7d32',
    '--theme-border': '#2e7d32',
    '--theme-shadow': 'rgba(51, 34, 85, 0.6)',
    '--theme-card-bg': '#f1e8d0ff',
    '--theme-filter-bg': '#a5d6a7',
    '--theme-filter-hover': '#81c784',
    '--theme-tag-bg': '#81c784',
    '--theme-scan-opacity': '0.25'
},

            
            neon: {
                '--theme-bg-primary': '#001122',
                '--theme-bg-secondary': '#003344',
                '--theme-text-primary': '#ffffff',
                '--theme-text-secondary': '#c8d1e0',
                '--theme-accent': '#ea76f2ff',
                '--theme-accent-hover': '#00ccff',
                '--theme-border': '#09a984ff',
                '--theme-shadow': '#1b2426ff',
                '--theme-card-bg': '#002233',
                '--theme-filter-bg': ' #00394d',
                '--theme-filter-hover': '#004c66',
                '--theme-tag-bg': '#004455',
                '--theme-scan-opacity': '0.18'
            },
            
            glitched: {
                '--theme-bg-primary':' #0a0a12',
                '--theme-bg-secondary':' #1a1a2e',
                '--theme-text-primary':' #ffffff',
                '--theme-text-secondary':' #c8d1e0',
                '--theme-accent':' #ff00cc',
                '--theme-accent-hover':' #6b6beaff',
                '--theme-border':' #6722b0ff', // old #ff00cc
                '--theme-shadow':' #000000ff',
                '--theme-card-bg':' #1a1a2e',
                '--theme-filter-bg':' #404071ff',
                '--theme-filter-hover':' #323262',
                '--theme-tag-bg':' #2a2a4a'
            }
        };

// Theme management functions
function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) {
        console.warn(`Theme "${themeName}" not found, using tavern theme`);
        themeName = 'tavern';
    }
    
    const root = document.documentElement;
    const selectedTheme = themes[themeName];
    
    // Apply all theme variables
    Object.entries(selectedTheme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    
    // Store current theme
    localStorage.setItem('currentTheme', themeName);
    console.log(`🎨 Applied theme: ${themeName}`);
    
    // Update theme indicator if it exists
    updateThemeIndicator(themeName);
}

function getRandomTheme() {
    const themeNames = Object.keys(themes);
    const randomIndex = Math.floor(Math.random() * themeNames.length);
    return themeNames[randomIndex];
}

function initializeRandomTheme() {
    const randomTheme = getRandomTheme();
    applyTheme(randomTheme);
}

// Optional: Create a subtle theme indicator
function createThemeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'theme-indicator';
    indicator.innerHTML = `
        <div class="theme-dot"></div>
        <div class="theme-tooltip">Click to change theme</div>
    `;
    
    // Styling for the indicator
    const style = document.createElement('style');
    style.textContent = `
        #theme-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--theme-accent);
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px var(--theme-shadow);
            transition: all 0.3s ease;
        }
        
        #theme-indicator:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 20px var(--theme-shadow);
        }
        
        .theme-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--theme-bg-secondary);
            transition: all 0.3s ease;
        }
        
        .theme-tooltip {
            position: absolute;
            top: -35px;
            right: 0;
            background: var(--theme-text-primary);
            color: var(--theme-bg-secondary);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        
        #theme-indicator:hover .theme-tooltip {
            opacity: 1;
        }
        
        @media (max-width: 768px) {
            #theme-indicator {
                width: 35px;
                height: 35px;
                top: 15px;
                right: 15px;
            }
            
            .theme-dot {
                width: 14px;
                height: 14px;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    // Click handler for theme switching
    indicator.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('currentTheme') || 'tavern';
        const themeNames = Object.keys(themes);
        const currentIndex = themeNames.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        const nextTheme = themeNames[nextIndex];
        
        applyTheme(nextTheme);
        
        // Add a little animation feedback
        indicator.style.transform = 'scale(0.9)';
        setTimeout(() => {
            indicator.style.transform = 'scale(1)';
        }, 150);
    });
}

function updateThemeIndicator(themeName) {
    const indicator = document.getElementById('theme-indicator');
    if (indicator) {
        const tooltip = indicator.querySelector('.theme-tooltip');
        if (tooltip) {
            tooltip.textContent = `Theme: ${themeName}`;
        }
    }
}

// Integration with your existing code
// Add this to your DOMContentLoaded event listener
function initializeThemes() {
    // Apply random theme on page load
    initializeRandomTheme();
    
    // Create theme switcher (optional)
    createThemeIndicator();
}

// Alternative: Less random approach - weighted randomization
function initializeSmartTheme() {
    const savedTheme = localStorage.getItem('currentTheme');
    const shouldRandomize = Math.random() > 0.3; // 70% chance of new theme
    
    if (shouldRandomize || !savedTheme) {
        initializeRandomTheme();
    } else {
        applyTheme(savedTheme);
    }
}

// Export for use in your main script
window.themeSystem = {
    initialize: initializeThemes,
    initializeSmart: initializeSmartTheme,
    applyTheme: applyTheme,
    getRandomTheme: getRandomTheme,
    themes: Object.keys(themes)
};