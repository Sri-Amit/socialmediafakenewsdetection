// Fake News Detector Extension - Background Script
// Handles API calls and data processing

const GEMINI_API_KEY = 'AIzaSyDaU5J4YTH70BihYb8QbGHjiK6negpX2os'; // Replace with your actual API key
const SERPAPI_KEY = '2dac97bf1929796a23e3babe9480e1a4e5e060cf9ee9a96a2582c001b7e23623'; // Replace with your actual SerpAPI key

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeTweet') {
        analyzeTweet(request.content)
            .then(result => sendResponse(result))
            .catch(error => {
                console.error('Analysis error:', error);
                sendResponse({ success: false, error: error.message });
            });
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
        console.log('Generating headline for:', content);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a professional news editor. Create a concise, factual headline (maximum 10 words) that summarizes the main claim or statement in the given text. Focus on the most newsworthy or controversial claim.

Create a headline for this tweet: "${content}"

Return only the headline text, no quotes or formatting.`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 50,
                    temperature: 0.3
                }
            })
        });

        console.log('Headline API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Headline API error response:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Headline API response data:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            throw new Error('Invalid response format from Gemini API');
        }
        
        const headline = data.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
        console.log('Generated headline:', headline);
        return headline;
    } catch (error) {
        console.error('Error generating headline:', error);
        throw new Error(`Headline generation failed: ${error.message}`);
    }
}

async function extractClaims(content) {
    try {
        console.log('Extracting claims from:', content);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Extract specific factual claims from the given text. Return ONLY a JSON array of strings, no other text.

Example format: ["claim 1", "claim 2", "claim 3"]

Extract claims from: "${content}"`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.1
                }
            })
        });

        console.log('Claims API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claims API error response:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Claims API response data:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            throw new Error('Invalid response format from Gemini API');
        }
        
        const claimsText = data.candidates[0].content.parts[0].text.trim();
        console.log('Raw claims text:', claimsText);
        
        try {
            // Try to parse as JSON
            const claims = JSON.parse(claimsText);
            if (Array.isArray(claims)) {
                return claims.filter(claim => claim.trim());
            } else {
                throw new Error('Claims response is not an array');
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Failed to parse claims:', claimsText);
            // Fallback: split by lines and clean up
            const claims = claimsText.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('[') && !line.startsWith(']') && !line.startsWith('"'))
                .map(line => line.replace(/^["']|["']$/g, '').trim())
                .filter(line => line.length > 0);
            
            if (claims.length === 0) {
                // Last resort: return the original content as a single claim
                return [content];
            }
            return claims;
        }
    } catch (error) {
        console.error('Error extracting claims:', error);
        throw new Error(`Claims extraction failed: ${error.message}`);
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
            
            console.log('Fact-checking claim:', claim);
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a fact-checker. Analyze the given claim against the provided sources. Return ONLY a JSON object with this exact format:
                            {
                                "verdict": "TRUE/FALSE/UNCLEAR",
                                "confidence": 0-100,
                                "reasoning": "brief explanation"
                            }
                            
                            Claim to check: "${claim}"
                            Available sources: ${JSON.stringify(sources)}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 300,
                        temperature: 0.1
                    }
                })
            });

            console.log('Fact-check API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fact-check API error response:', errorText);
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Fact-check API response data:', data);
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                throw new Error('Invalid response format from Gemini API');
            }
            
            const resultText = data.candidates[0].content.parts[0].text.trim();
            console.log('Raw fact-check result:', resultText);
            
            try {
                const result = JSON.parse(resultText);
                factChecks.push({
                    claim: claim,
                    verdict: result.verdict || 'UNCLEAR',
                    confidence: result.confidence || 50,
                    reasoning: result.reasoning || 'Unable to verify'
                });
            } catch (parseError) {
                console.error('JSON parse error for fact-check:', parseError);
                console.error('Failed to parse:', resultText);
                factChecks.push({
                    claim: claim,
                    verdict: 'UNCLEAR',
                    confidence: 50,
                    reasoning: 'Analysis failed - invalid response format'
                });
            }
        }
        
        return factChecks;
    } catch (error) {
        console.error('Error fact-checking claims:', error);
        throw new Error(`Fact-checking failed: ${error.message}`);
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
        console.log('Generating analysis for content:', content);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
                        Sources found: ${sources.length}

Provide a clear, concise analysis.`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.3
                }
            })
        });

        console.log('Analysis API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Analysis API error response:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Analysis API response data:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            throw new Error('Invalid response format from Gemini API');
        }
        
        const analysis = data.candidates[0].content.parts[0].text.trim();
        console.log('Generated analysis:', analysis);
        return analysis;
    } catch (error) {
        console.error('Error generating analysis:', error);
        throw new Error(`Analysis generation failed: ${error.message}`);
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