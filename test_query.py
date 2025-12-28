import urllib.request
import urllib.parse
import json
import datetime

def get_on_this_day():
    url = "https://query.wikidata.org/sparql"
    query = """
    SELECT ?entity ?entityLabel ?date WHERE {
      ?entity wdt:P31/wdt:P279* wd:Q1190554.
      ?entity wdt:P585 ?date.
      FILTER(MONTH(?date) = MONTH(NOW()) && DAY(?date) = DAY(NOW()))
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 5
    """
    
    params = urllib.parse.urlencode({'format': 'json', 'query': query})
    full_url = f"{url}?{params}"
    
    req = urllib.request.Request(full_url)
    req.add_header("User-Agent", "DailyFactsBot/1.0 (mailto:your_email@example.com)")
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("Successfully fetched data!")
            for item in data['results']['bindings']:
                print(f"Label: {item.get('entityLabel', {}).get('value')}")
                print(f"Date: {item.get('date', {}).get('value')}")
                print("---")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_on_this_day()
