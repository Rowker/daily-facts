document.addEventListener('DOMContentLoaded', () => {
    const currentDateElement = document.getElementById('current-date');
    const factTextElement = document.getElementById('fact-text');
    const factYearElement = document.getElementById('fact-year');
    const readMoreLink = document.getElementById('read-more-link');
    const nextFactBtn = document.getElementById('next-fact-btn');
    const loader = document.getElementById('loader');
    const factContent = document.getElementById('fact-content');
    const factDescriptionElement = document.getElementById('fact-description');

    let facts = [];
    let currentFactIndex = 0;

    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('en-US', options);

    // Fetch facts
    fetchFacts();

    nextFactBtn.addEventListener('click', () => {
        showNextFact();
    });

    async function fetchFacts() {
        showLoading(true);

        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            processFacts(data);
        } catch (error) {
            console.error('Error fetching facts:', error);
            factTextElement.textContent = "Failed to load facts. Please try again later.";
            showLoading(false);
        }
    }

    function processFacts(data) {
        if (!data.selected || !data.selected.length) {
            factTextElement.textContent = "No facts found for today.";
            showLoading(false);
            return;
        }

        // Shuffle facts for randomness
        facts = data.selected.sort(() => 0.5 - Math.random());
        currentFactIndex = 0;
        displayFact(facts[0]);
    }

    function displayFact(fact) {
        // Animate out
        factContent.style.opacity = '0';

        setTimeout(() => {
            const label = fact.text;
            const year = fact.year;
            // Use the first related page for the link and description if available
            const relatedPage = fact.pages && fact.pages[0];
            const wikipediaLink = relatedPage ? relatedPage.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${year}`;
            const description = relatedPage ? relatedPage.extract : "";

            factTextElement.textContent = label;
            factYearElement.textContent = year;
            factDescriptionElement.textContent = description;
            readMoreLink.href = wikipediaLink;
            readMoreLink.textContent = "Read more on Wikipedia";

            showLoading(false);
            // Animate in
            setTimeout(() => {
                factContent.style.opacity = '1';
            }, 50);
        }, 300);
    }

    function showNextFact() {
        currentFactIndex = (currentFactIndex + 1) % facts.length;
        displayFact(facts[currentFactIndex]);
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
