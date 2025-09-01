// Fake News Detector Extension - Background Script
// Handles API calls and data processing

const GEMINI_API_KEY = 'AIzaSyDaU5J4YTH70BihYb8QbGHjiK6negpX2os'; // Replace with your actual API key
const SERPAPI_KEY = '2dac97bf1929796a23e3babe9480e1a4e5e060cf9ee9a96a2582c001b7e23623'; // Replace with your actual SerpAPI key

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeTweet') {
        analyzeTweet(request.content)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep the message channel open for async response
    }
});

async function analyzeTweet(content) {
    try {
        console.log('Analyzing tweet:', content);

        // Step 1: Generate headline summary using Google Gemini
        const headline = await generateHeadline(content);
        console.log('Generated headline:', headline);

        // Step 2: Extract claims for fact-checking
        const claims = await extractClaims(content);
        console.log('Extracted claims:', claims);

        // Step 3: Search for credible sources
        const sources = await searchCredibleSources(content);
        console.log('Found sources:', sources);

        // Step 4: Fact-check claims against sources
        const factChecks = await factCheckClaims(claims, sources);
        console.log('Fact check results:', factChecks);

        // Step 5: Calculate credibility score
        const credibilityScore = calculateCredibilityScore(factChecks, sources);
        console.log('Credibility score:', credibilityScore);

        // Step 6: Generate detailed analysis
        const analysis = await generateAnalysis(content, factChecks, sources, credibilityScore);
        console.log('Analysis generated');

        return {
            success: true,
            data: {
                headline,
                credibilityScore,
                factChecks,
                sources,
                analysis
            }
        };

    } catch (error) {
        console.error('Error in analyzeTweet:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function generateHeadline(content) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a professional news editor. Create a concise, factual headline (maximum 10 words) that summarizes the main claim or statement in the given text. Focus on the most newsworthy or controversial claim.

Create a headline for this tweet: "${content}"`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 50,
                    temperature: 0.3
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error('Error generating headline:', error);
        return 'Headline generation failed';
    }
}

async function extractClaims(content) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Extract specific factual claims from the given text. Return only the claims as a JSON array of strings. Focus on verifiable statements, statistics, or assertions that can be fact-checked.

Extract claims from: "${content}"`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.1
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const claimsText = data.candidates[0].content.parts[0].text.trim();
        
        try {
            return JSON.parse(claimsText);
        } catch (parseError) {
            // Fallback: split by lines or return the content as a single claim
            return claimsText.split('\n').filter(claim => claim.trim());
        }
    } catch (error) {
        console.error('Error extracting claims:', error);
        return [content]; // Return the original content as a single claim
    }
}

async function searchCredibleSources(content) {
    try {
        // Use SerpAPI to search for credible news sources
        const searchQuery = encodeURIComponent(content);
        const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${searchQuery}&api_key=${SERPAPI_KEY}&num=10&tbm=nws`);
        
        if (!response.ok) {
            throw new Error(`SerpAPI error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.news_results) {
            return [];
        }

        // Filter for credible sources
        const credibleDomains = [
            'reuters.com', 'ap.org', 'bbc.com', 'npr.org', 'pbs.org',
            'nytimes.com', 'washingtonpost.com', 'wsj.com', 'usatoday.com',
            'cnn.com', 'foxnews.com', 'abcnews.go.com', 'cbsnews.com',
            'nbcnews.com', 'time.com', 'newsweek.com', 'theatlantic.com',
            'economist.com', 'scientificamerican.com', 'nature.com'
        ];

        return data.news_results
            .filter(result => {
                const domain = new URL(result.link).hostname.replace('www.', '');
                return credibleDomains.some(credible => domain.includes(credible));
            })
            .map(result => ({
                title: result.title,
                url: result.link,
                snippet: result.snippet,
                source: new URL(result.link).hostname
            }))
            .slice(0, 5); // Limit to top 5 results

    } catch (error) {
        console.error('Error searching sources:', error);
        return [];
    }
}

async function factCheckClaims(claims, sources) {
    try {
        const factChecks = [];
        
        for (const claim of claims) {
            if (!claim.trim()) continue;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a fact-checker. Analyze the given claim against the provided sources. Return a JSON object with:
                            {
                                "claim": "the original claim",
                                "verdict": "TRUE/FALSE/UNCLEAR",
                                "confidence": 0-100,
                                "reasoning": "brief explanation"
                            }
                            
                            Sources: ${JSON.stringify(sources)}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 300,
                        temperature: 0.1
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`); // Changed to Gemini API error
            }

            const data = await response.json();
            const resultText = data.candidates[0].content.parts[0].text.trim();
            
            try {
                const result = JSON.parse(resultText);
                factChecks.push({
                    claim: claim,
                    verdict: result.verdict || 'UNCLEAR',
                    confidence: result.confidence || 50,
                    reasoning: result.reasoning || 'Unable to verify'
                });
            } catch (parseError) {
                factChecks.push({
                    claim: claim,
                    verdict: 'UNCLEAR',
                    confidence: 50,
                    reasoning: 'Analysis failed'
                });
            }
        }
        
        return factChecks;
    } catch (error) {
        console.error('Error fact-checking claims:', error);
        return claims.map(claim => ({
            claim: claim,
            verdict: 'UNCLEAR',
            confidence: 50,
            reasoning: 'Fact-checking failed'
        }));
    }
}

function calculateCredibilityScore(factChecks, sources) {
    if (factChecks.length === 0) {
        return 50; // Neutral score if no claims to check
    }

    let totalScore = 0;
    let totalWeight = 0;

    // Score based on fact check results
    factChecks.forEach(check => {
        let claimScore = 50; // Neutral starting point
        
        if (check.verdict === 'TRUE') {
            claimScore = 80 + (check.confidence / 100) * 20; // 80-100 range
        } else if (check.verdict === 'FALSE') {
            claimScore = 20 - (check.confidence / 100) * 20; // 0-20 range
        } else {
            claimScore = 40 + (check.confidence / 100) * 20; // 40-60 range for unclear
        }
        
        totalScore += claimScore;
        totalWeight += 1;
    });

    // Bonus for having credible sources
    if (sources.length > 0) {
        totalScore += Math.min(sources.length * 5, 20); // Up to 20 points bonus
        totalWeight += 1;
    }

    const finalScore = Math.round(totalScore / totalWeight);
    return Math.max(0, Math.min(100, finalScore)); // Ensure score is between 0-100
}

async function generateAnalysis(content, factChecks, sources, credibilityScore) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a fact-checking analyst. Provide a brief, objective analysis of the credibility of the given content based on the fact-check results and sources. Keep it under 100 words.

Analyze this content: "${content}"
                        
                        Fact checks: ${JSON.stringify(factChecks)}
                        Credibility score: ${credibilityScore}%
                        Sources found: ${sources.length}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.3
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`); // Changed to Gemini API error
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Error generating analysis:', error);
        return 'Analysis generation failed';
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Fake News Detector extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
        autoAnalyze: false
    });
}); 