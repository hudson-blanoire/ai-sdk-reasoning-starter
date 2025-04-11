// Script to test the Exa search tool directly
require('dotenv').config({ path: '.env.local' });
const { ExaClient } = require('@agentic/exa');

async function testExaSearch() {
  const query = "How many points did Nikola Jokic score in Yesterday's game?";
  console.log("Testing Exa search with query:", query);

  const exaApiKey = process.env.EXA_API_KEY;
  if (!exaApiKey) {
    console.error('Exa API key is not configured');
    return;
  }

  try {
    // Initialize the ExaClient with the API key
    const exa = new ExaClient({
      apiKey: exaApiKey
    });

    // Calculate start date (3 months ago)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startDate = threeMonthsAgo.toISOString().split('T')[0]; // Format YYYY-MM-DD

    console.log(`Exa search: Filtering results from ${startDate} onwards.`);

    // Use the client to perform the search with options
    const searchResults = await exa.search({
      query: `${query} (after:${startDate})`,
      numResults: 15,
      useAutoprompt: true,
      startPublishedDate: startDate,
      type: "keyword",
      contents: {
        text: true,
        highlights: {
          numSentences: 4,
          highlightsPerUrl: 3
        }
      }
    });

    // Display results
    console.log("Search results count:", searchResults.results?.length || 0);
    
    // Show the first few results
    if (searchResults.results && searchResults.results.length > 0) {
      console.log("\nFirst 3 results:");
      searchResults.results.slice(0, 3).forEach((result, index) => {
        console.log(`\n[Result ${index + 1}]`);
        console.log(`Title: ${result.title || 'No title'}`);
        console.log(`URL: ${result.url}`);
        console.log(`Published Date: ${result.publishedDate || 'Unknown'}`);
        console.log(`Highlights: ${result.highlights ? result.highlights.slice(0, 2).join('\n') : 'None'}`);
      });
    } else {
      console.log("No results found");
    }
    
  } catch (error) {
    console.error("Exa search error:", error);
  }
}

// Run the test
testExaSearch().then(() => console.log("Test completed"));
