document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const currentDateElement = document.getElementById('current-date');
    const currentDateMobile = document.getElementById('current-date-mobile');

    // Main Card Elements
    const factTextElement = document.getElementById('fact-text');
    const factTitleElement = document.getElementById('fact-title');
    const factYearElement = document.getElementById('fact-year');
    const factImageElement = document.getElementById('fact-image');
    const factImageContainer = document.getElementById('fact-image-container');
    const readMoreLink = document.getElementById('read-more-link');
    const nextFactBtn = document.getElementById('next-fact-btn');
    const loader = document.getElementById('loader');
    const factContent = document.getElementById('fact-content');

    // Sidebar Elements
    const birthsList = document.getElementById('births-list');
    const deathsList = document.getElementById('deaths-list');
    const categoryBtns = document.querySelectorAll('.category-btn');

    // State
    let allData = null;
    let currentCategory = 'general';
    let filteredFacts = [];
    let currentFactIndex = 0;

    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    currentDateElement.textContent = dateString;
    currentDateMobile.textContent = dateString;

    // Initialize
    fetchFacts();

    // Event Listeners
    nextFactBtn.addEventListener('click', () => {
        showNextFact();
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update category
            currentCategory = btn.dataset.category;
            filterFacts();
        });
    });

    async function fetchFacts() {
        showLoading(true);

        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            allData = await response.json();

            // Populate Sidebars
            populateSidebar(birthsList, allData.births, 'Born');
            populateSidebar(deathsList, allData.deaths, 'Died');

            // Initial Filter
            filterFacts();

        } catch (error) {
            console.error('Error fetching facts:', error);
            factTextElement.textContent = "Failed to load facts. Please try again later.";
            showLoading(false);
        }
    }

    function filterFacts() {
        if (!allData) return;

        // Use 'events' for specific categories to get more results, 'selected' for general
        const sourceData = currentCategory === 'general' ? allData.selected : allData.events;

        if (!sourceData) {
            factTextElement.textContent = "Loading data...";
            return;
        }

        switch (currentCategory) {
            case 'us_history':
                const usKeywords = [
                    'united states', 'american', 'u.s.', 'usa', 'president', 'congress', 'senate',
                    'white house', 'constitution', 'civil war', 'revolution', 'independence',
                    'federal', 'supreme court', 'pentagon', 'nasa', 'apollo', 'space shuttle',
                    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
                    'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
                    'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
                    'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
                    'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
                    'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
                    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
                    'wisconsin', 'wyoming', 'confederate', 'union army', 'declaration of independence'
                ];
                filteredFacts = sourceData.filter(fact => {
                    const text = fact.text.toLowerCase();
                    return usKeywords.some(keyword => text.includes(keyword));
                });
                break;
            case 'sports':
                const sportsKeywords = [
                    'sport', 'game', 'cup', 'championship', 'olympic', 'league', 'player', 'team', 'won',
                    'nfl', 'nba', 'mlb', 'nhl', 'super bowl', 'world series', 'stanley cup', 'touchdown',
                    'homerun', 'slam dunk', 'quarterback', 'pitcher', 'goal', 'medal', 'tournament',
                    'wimbledon', 'us open', 'fifa', 'uefa', 'boxing', 'heavyweight', 'champion', 'race',
                    'nascar', 'formula one', 'grand prix', 'marathon', 'rugby', 'cricket', 'basketball',
                    'baseball', 'football', 'hockey', 'soccer', 'tennis', 'golf', 'pga', 'masters'
                ];
                filteredFacts = sourceData.filter(fact => {
                    const text = fact.text.toLowerCase();
                    return sportsKeywords.some(keyword => text.includes(keyword));
                });
                break;
            default: // general
                filteredFacts = sourceData;
        }

        if (filteredFacts.length === 0) {
            // Specific message if no facts match category
            factTitleElement.textContent = "No Facts Found";
            factTextElement.textContent = `We couldn't find any ${currentCategory.replace('_', ' ')} facts for today. Try another category!`;
            factYearElement.textContent = "";
            factImageContainer.classList.add('hidden');
            readMoreLink.style.display = 'none';
        } else {
            // Shuffle
            filteredFacts = filteredFacts.sort(() => 0.5 - Math.random());
            currentFactIndex = 0;
            readMoreLink.style.display = 'inline-block';
            displayFact(filteredFacts[0]);
        }
    }

    function displayFact(fact) {
        if (!fact) return;

        // Animate out
        factContent.style.opacity = '0';

        setTimeout(() => {
            const year = fact.year;
            const text = fact.text;

            // Title Logic: Use the first page title, or a fallback
            let title = "Historical Event";
            let imageSrc = null;
            let wikipediaLink = `https://en.wikipedia.org/wiki/${year}`;

            if (fact.pages && fact.pages.length > 0) {
                const page = fact.pages[0];
                title = page.title.replace(/_/g, ' '); // Use the Wikipedia page title, formatted
                wikipediaLink = page.content_urls.desktop.page;

                if (page.thumbnail) {
                    imageSrc = page.thumbnail.source;
                } else if (page.originalimage) {
                    imageSrc = page.originalimage.source;
                }
            }

            // Update DOM
            factYearElement.textContent = year;
            factTitleElement.textContent = title;
            factTextElement.textContent = text;
            readMoreLink.href = wikipediaLink;
            readMoreLink.textContent = "Read more on Wikipedia";

            // Image Handling
            if (imageSrc) {
                factImageElement.src = imageSrc;
                factImageContainer.classList.remove('hidden');
            } else {
                factImageContainer.classList.add('hidden');
            }

            showLoading(false);
            // Animate in
            setTimeout(() => {
                factContent.style.opacity = '1';
            }, 50);
        }, 300);
    }

    function populateSidebar(listElement, data, type) {
        if (!data) return;

        // Take top 10 random or sorted
        const items = data.sort((a, b) => b.year - a.year).slice(0, 20); // Show recent 20

        listElement.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'person-item';

            const name = item.text.split(',')[0]; // Simple heuristic to get name
            // Or use item.pages[0].title if available

            li.innerHTML = `
                <span class="person-year">${item.year}</span>
                <span class="person-name">${name}</span>
                <span class="person-desc">${item.text}</span>
            `;
            listElement.appendChild(li);
        });
    }

    function showNextFact() {
        currentFactIndex = (currentFactIndex + 1) % filteredFacts.length;
        displayFact(filteredFacts[currentFactIndex]);
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loader.classList.remove('hidden');
            factContent.classList.add('hidden');
        } else {
            loader.classList.add('hidden');
            factContent.classList.remove('hidden');
        }
    }
});
