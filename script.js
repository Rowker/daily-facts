document.addEventListener('DOMContentLoaded', () => {
    const currentDateElement = document.getElementById('current-date');
    const factTextElement = document.getElementById('fact-text');
    const factYearElement = document.getElementById('fact-year');
    const readMoreLink = document.getElementById('read-more-link');
    const nextFactBtn = document.getElementById('next-fact-btn');
    const loader = document.getElementById('loader');
    const factContent = document.getElementById('fact-content');

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

    function fetchFacts() {
        showLoading(true);

        const month = now.getMonth() + 1; // JS months are 0-indexed
        const day = now.getDate();

        const sparqlQuery = `
            SELECT ?entity ?entityLabel ?date ?article WHERE {
              ?entity wdt:P31/wdt:P279* wd:Q1190554.
              ?entity wdt:P585 ?date.
              FILTER(MONTH(?date) = ${month} && DAY(?date) = ${day})
              OPTIONAL {
                ?article schema:about ?entity .
                ?article schema:isPartOf <https://en.wikipedia.org/> .
              }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            }
            LIMIT 50
        `;

        // Use JSONP to avoid CORS issues
        const callbackName = 'wikidataCallback_' + Date.now();
        window[callbackName] = function (data) {
            processFacts(data);
            delete window[callbackName];
            document.body.removeChild(script);
        };

        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json&callback=${callbackName}`;

        const script = document.createElement('script');
        script.src = url;
        script.onerror = function () {
            console.error('Error fetching facts via JSONP');
            factTextElement.textContent = "Failed to load facts. Please try again later.";
            showLoading(false);
            delete window[callbackName];
            document.body.removeChild(script);
        };
        document.body.appendChild(script);
    }

    function processFacts(data) {
        if (!data.results.bindings.length) {
            factTextElement.textContent = "No facts found for today.";
            showLoading(false);
            return;
        }

        // Shuffle facts for randomness
        facts = data.results.bindings.sort(() => 0.5 - Math.random());
        currentFactIndex = 0;
        displayFact(facts[0]);
    }

    async function displayFact(fact) {
        // Animate out
        factContent.style.opacity = '0';
        showLoading(true);

        const label = fact.entityLabel.value;
        const date = new Date(fact.date.value);
        const year = date.getFullYear();
        const wikipediaLink = fact.article ? fact.article.value : `https://www.wikidata.org/wiki/${fact.entity.value.split('/').pop()}`;

        let description = "";
        if (fact.article) {
            try {
                const title = fact.article.value.split('/').pop();
                const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
                const response = await fetch(summaryUrl);
                if (response.ok) {
                    const data = await response.json();
                    description = data.extract;
                }
            } catch (e) {
                console.error("Failed to fetch description", e);
            }
        }

        setTimeout(() => {
            factTextElement.textContent = label;
            factYearElement.textContent = year;
            document.getElementById('fact-description').textContent = description;
            readMoreLink.href = wikipediaLink;
            readMoreLink.textContent = fact.article ? "Read more on Wikipedia" : "View on Wikidata";

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
