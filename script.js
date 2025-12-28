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
                    'united states', 'american', 'u.s.', 'usa', 'us president', 'congress', 'senate',
                    'white house', 'constitution', 'civil war', 'american revolution', 'independence day',
                    'federal government', 'supreme court', 'pentagon', 'nasa', 'apollo', 'space shuttle',
                    'confederate', 'union army', 'declaration of independence', 'bill of rights',
                    'gettysburg', 'lincoln', 'washington d.c.', 'native american', 'cherokee', 'sioux',
                    'apache', 'navajo', 'pearl harbor', 'vietnam war', 'korean war', 'gulf war',
                    'manhattan project', 'wall street', 'hollywood', 'broadway', 'mount rushmore',
                    'statue of liberty', 'ellis island', 'alamo', 'lewis and clark', 'oregon trail',
                    'gold rush', 'prohibition', 'suffrage', 'civil rights', 'martin luther king',
                    'jfk', 'fdr', 'roosevelt', 'kennedy', 'nixon', 'reagan', 'obama', 'clinton', 'bush'
                ];
                // Exclude terms that might match generic words but aren't US history
                const usExclude = ['soviet', 'russian', 'french', 'british', 'european', 'canadian', 'mexican', 'chinese', 'japanese', 'german', 'italian'];

                filteredFacts = sourceData.filter(fact => {
                    const text = fact.text.toLowerCase();
                    const matchesKeyword = usKeywords.some(keyword => text.includes(keyword));
                    const matchesExclude = usExclude.some(keyword => text.includes(keyword));

                    // Special case for state names: only include if they are likely referring to the state context
                    // (This is hard without NLP, so we'll skip state names for now to be safe, or rely on specific events)

                    return matchesKeyword && !matchesExclude;
                });
                break;
            case 'sports':
                const sportsKeywords = [
                    'nfl', 'nba', 'mlb', 'nhl', 'super bowl', 'world series', 'stanley cup',
                    'olympic', 'wimbledon', 'us open', 'fifa', 'uefa', 'nascar', 'formula one',
                    'grand prix', 'pga tour', 'masters tournament', 'ryder cup', 'davis cup',
                    'world cup', 'touchdown', 'homerun', 'slam dunk', 'quarterback', 'no-hitter',
                    'hat trick', 'gold medal', 'silver medal', 'bronze medal', 'heavyweight champion',
                    'boxing title', 'wba', 'wbc', 'ibf', 'wbo', 'ufc', 'mma', 'wwe', 'wrestlemania',
                    'tour de france', 'giro d\'italia', 'vuelta a espana', 'indy 500', 'daytona 500',
                    'kentucky derby', 'preakness', 'belmont stakes', 'triple crown', 'heisman trophy',
                    'mvp', 'cy young', 'rookie of the year', 'hall of fame', 'all-star'
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

        // Keywords for importance/US context
        const importanceKeywords = [
            'united states', 'american', 'usa', 'president', 'king', 'queen', 'emperor',
            'prime minister', 'nobel', 'scientist', 'inventor', 'artist', 'musician',
            'writer', 'author', 'general', 'admiral', 'pope', 'founder', 'ceo',
            'activist', 'leader', 'legend', 'star', 'famous', 'notable'
        ];

        // Filter
        let items = data.filter(item => {
            const text = item.text.toLowerCase();
            return importanceKeywords.some(keyword => text.includes(keyword));
        });

        // Randomize the "Important" items so it's not the same 5 every time
        items = items.sort(() => 0.5 - Math.random());

        // If we don't have enough "important" people, fill with others (also randomized)
        if (items.length < 5) {
            let remaining = data.filter(item => !items.includes(item));
            remaining = remaining.sort(() => 0.5 - Math.random());
            items = items.concat(remaining.slice(0, 5 - items.length));
        }

        // Limit to 5
        items = items.slice(0, 5);

        listElement.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'person-item';

            // Parse Name and Description
            const firstCommaIndex = item.text.indexOf(',');
            let name = item.text;
            let description = "";

            if (firstCommaIndex !== -1) {
                name = item.text.substring(0, firstCommaIndex);
                description = item.text.substring(firstCommaIndex + 1).trim();
                description = description.charAt(0).toUpperCase() + description.slice(1);
            } else {
                name = "Notable Figure";
                description = item.text;
            }

            // Generate Link if available
            let nameHtml = `<span class="person-name">${name}</span>`;
            if (item.pages && item.pages.length > 0) {
                const pageUrl = item.pages[0].content_urls.desktop.page;
                nameHtml = `<a href="${pageUrl}" target="_blank" class="person-name person-link">${name}</a>`;
            }

            li.innerHTML = `
                <span class="person-year">${item.year}</span>
                ${nameHtml}
                ${description ? `<span class="person-desc">${description}</span>` : ''}
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
