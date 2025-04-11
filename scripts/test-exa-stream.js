// Script to test the Exa streamAnswer API
require('dotenv').config({ path: '.env.local' });
const Exa = require('exa-js').default;

async function testExaStreamAnswer() {
  const query = "How many points did Nikola Jokic score in Yesterday's game?";
  console.log("Testing Exa streamAnswer with query:", query);

  const exaApiKey = process.env.EXA_API_KEY;
  if (!exaApiKey) {
    console.error('Exa API key is not configured');
    return;
  }

  try {
    // Initialize the Exa client with the API key
    const exa = new Exa(exaApiKey);
    
    console.log("Using Exa streamAnswer API for more accurate results");

    // Use the streamAnswer API to get more accurate and relevant results
    const streamResponse = await exa.streamAnswer(
      query,
      {
        model: "exa-pro"
      }
    );

    console.log("Stream response:", JSON.stringify(streamResponse, null, 2));

    // Process the stream response to extract citations
    let citations = [];
    
    // Extract citations from the response
    if (streamResponse && streamResponse.citations && streamResponse.citations.length > 0) {
      citations = streamResponse.citations;
      console.log("Found citations:", JSON.stringify(citations, null, 2));
    } else {
      console.log("No citations found in the response");
    }

    // Display the citations
    if (citations.length > 0) {
      console.log("\nCitations found:");
      citations.forEach((citation, index) => {
        console.log(`\n[Citation ${index + 1}]`);
        console.log(`Title: ${citation.title || 'No title'}`);
        console.log(`URL: ${citation.url}`);
        console.log(`Published Date: ${citation.publishedDate || 'Unknown'}`);
        console.log(`Author: ${citation.author || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.error("Exa streamAnswer error:", error);
  }
}

// Run the test
testExaStreamAnswer().then(() => console.log("Test completed"));
