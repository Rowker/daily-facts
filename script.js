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
        if (!allData || !allData.selected) return;

        const allSelected = allData.selected;

        switch (currentCategory) {
            case 'us_history':
                filteredFacts = allSelected.filter(fact => {
                    const text = fact.text.toLowerCase();
                    return text.includes('united states') ||
                        text.includes('american') ||
                        text.includes('u.s.') ||
                        text.includes('usa') ||
                        text.includes('president') ||
                        text.includes('congress');
                });
                break;
            case 'sports':
                filteredFacts = allSelected.filter(fact => {
                    const text = fact.text.toLowerCase();
                    return text.includes('sport') ||
                        text.includes('game') ||
                        text.includes('cup') ||
                        text.includes('championship') ||
                        text.includes('olympic') ||
                        text.includes('league') ||
                        text.includes('player') ||
                        text.includes('team') ||
                        text.includes('won');
                });
                break;
            default: // general
                filteredFacts = allSelected;
        }

        if (filteredFacts.length === 0) {
            // Fallback if no facts match category
            filteredFacts = allSelected;
            // Optional: Show a message saying "No specific facts found, showing all"
        }

        // Shuffle
        filteredFacts = filteredFacts.sort(() => 0.5 - Math.random());
        currentFactIndex = 0;
        displayFact(filteredFacts[0]);
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
