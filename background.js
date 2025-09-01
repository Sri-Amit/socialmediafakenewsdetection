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

        // Step 4: Analyze each claim individually with its own credibility score
        const claimAnalyses = await analyzeIndividualClaims(claims, sources);
        console.log('Individual claim analyses:', claimAnalyses);

        // Step 5: Calculate overall tweet credibility as average of claim scores
        const overallCredibility = calculateOverallCredibility(claimAnalyses);
        console.log('Overall credibility score:', overallCredibility);

        // Step 6: Generate detailed analysis
        const analysis = await generateAnalysis(content, claimAnalyses, sources, overallCredibility);
        console.log('Analysis generated');

        return {
            success: true,
            data: {
                headline,
                credibilityScore: overallCredibility,
                factChecks: claimAnalyses,
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

async function analyzeIndividualClaims(claims, sources) {
    try {
        const claimAnalyses = [];
        
        for (const claim of claims) {
            if (!claim.trim()) continue;
            
            console.log('Analyzing individual claim:', claim);
            
            // Step 1: Get fact-check verdict for the claim
            const factCheck = await getFactCheckVerdict(claim, sources);
            console.log('Fact-check result:', factCheck);
            
            // Step 2: Calculate individual claim credibility score
            const claimCredibility = calculateClaimCredibility(factCheck, sources);
            console.log('Claim credibility score:', claimCredibility);
            
            // Step 3: Store complete claim analysis
            claimAnalyses.push({
                claim: claim,
                verdict: factCheck.verdict,
                confidence: factCheck.confidence,
                reasoning: factCheck.reasoning,
                credibilityScore: claimCredibility,
                sourcesUsed: sources.length > 0 ? sources.slice(0, 3) : [] // Limit to top 3 sources per claim
            });
        }
        
        return claimAnalyses;
    } catch (error) {
        console.error('Error analyzing individual claims:', error);
        throw new Error(`Individual claim analysis failed: ${error.message}`);
    }
}

async function getFactCheckVerdict(claim, sources) {
    try {
        console.log('Getting fact-check verdict for claim:', claim);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a fact-checker. Analyze the given claim against the provided sources. 

IMPORTANT: You must respond with ONLY a valid JSON object. No other text, explanations, or formatting.

Required JSON format:
{
    "verdict": "TRUE",
    "confidence": 85,
    "reasoning": "This claim is supported by credible sources"
}

Valid verdicts: "TRUE", "FALSE", or "UNCLEAR"
Confidence: integer from 0-100
Reasoning: brief explanation in quotes

Claim to check: "${claim}"
Available sources: ${JSON.stringify(sources)}

Respond with ONLY the JSON object:`
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
        console.log('Raw fact-check result text:', resultText);
        
        try {
            // Try to parse as JSON
            const result = JSON.parse(resultText);
            console.log('Successfully parsed JSON result:', result);
            
            // Validate the result structure
            if (typeof result !== 'object' || result === null) {
                throw new Error('Result is not an object');
            }
            
            return {
                verdict: result.verdict || 'UNCLEAR',
                confidence: result.confidence || 50,
                reasoning: result.reasoning || 'Unable to verify'
            };
        } catch (parseError) {
            console.error('JSON parse error for fact-check:', parseError);
            console.error('Failed to parse result text:', resultText);
            
            // Try to extract information from malformed JSON
            const extractedResult = extractFromMalformedJSON(resultText);
            if (extractedResult) {
                console.log('Successfully extracted from malformed JSON:', extractedResult);
                return extractedResult;
            }
            
            return {
                verdict: 'UNCLEAR',
                confidence: 50,
                reasoning: `Analysis failed - invalid response format. Raw response: ${resultText.substring(0, 100)}...`
            };
        }
    } catch (error) {
        console.error('Error getting fact-check verdict:', error);
        return {
            verdict: 'UNCLEAR',
            confidence: 50,
            reasoning: `Fact-checking failed: ${error.message}`
        };
    }
}

function extractFromMalformedJSON(text) {
    try {
        // Try to extract verdict
        const verdictMatch = text.match(/"verdict"\s*:\s*"([^"]+)"/i);
        const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : null;
        
        // Try to extract confidence
        const confidenceMatch = text.match(/"confidence"\s*:\s*(\d+)/i);
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : null;
        
        // Try to extract reasoning
        const reasoningMatch = text.match(/"reasoning"\s*:\s*"([^"]+)"/i);
        const reasoning = reasoningMatch ? reasoningMatch[1] : null;
        
        // Validate verdict
        if (verdict && ['TRUE', 'FALSE', 'UNCLEAR'].includes(verdict)) {
            return {
                verdict: verdict,
                confidence: confidence && confidence >= 0 && confidence <= 100 ? confidence : 50,
                reasoning: reasoning || 'Extracted from malformed response'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting from malformed JSON:', error);
        return null;
    }
}

function calculateClaimCredibility(factCheck, sources) {
    let baseScore = 50; // Neutral starting point
    
    // Calculate base score based on verdict and confidence
    if (factCheck.verdict === 'TRUE') {
        baseScore = 80 + (factCheck.confidence / 100) * 20; // 80-100 range
    } else if (factCheck.verdict === 'FALSE') {
        baseScore = 20 - (factCheck.confidence / 100) * 20; // 0-20 range
    } else {
        baseScore = 40 + (factCheck.confidence / 100) * 20; // 40-60 range for unclear
    }
    
    // Apply source bonus to this specific claim
    let sourceBonus = 0;
    if (sources.length > 0) {
        // Each source adds a small bonus, but cap it to prevent over-inflation
        sourceBonus = Math.min(sources.length * 2, 10); // Max 10 points bonus per claim
    }
    
    // Calculate final claim score
    const finalScore = baseScore + sourceBonus;
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, Math.round(finalScore)));
}

function calculateOverallCredibility(claimAnalyses) {
    if (claimAnalyses.length === 0) {
        return 50; // Neutral score if no claims to analyze
    }
    
    // Calculate average of all individual claim credibility scores
    const totalCredibility = claimAnalyses.reduce((sum, analysis) => {
        return sum + analysis.credibilityScore;
    }, 0);
    
    const averageCredibility = totalCredibility / claimAnalyses.length;
    
    // Return rounded score between 0-100
    return Math.max(0, Math.min(100, Math.round(averageCredibility)));
}

async function generateAnalysis(content, claimAnalyses, sources, credibilityScore) {
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
                        text: `You are a fact-checking analyst. Provide a brief, objective analysis of the credibility of the given content based on the individual claim analyses and overall credibility score. Keep it under 150 words.

Analyze this content: "${content}"
                        
                        Individual Claim Analyses: ${JSON.stringify(claimAnalyses)}
                        Overall Credibility Score: ${credibilityScore}%
                        Total Sources Found: ${sources.length}

Provide a clear, concise analysis that explains the overall credibility and highlights any notable individual claims.`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 200,
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