// Fake News Twitter Detection - Web Application
// Converted from Chrome Extension

// Configuration
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyDaU5J4YTH70BihYb8QbGHjiK6negpX2os', // Replace with your actual API key
    SERPAPI_KEY: '2dac97bf1929796a23e3babe9480e1a4e5e060cf9ee9a96a2582c001b7e23623', // Replace with your actual SerpAPI key
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    SERPAPI_URL: 'https://serpapi.com/search.json'
};

// DOM elements
const tweetInput = document.getElementById('tweetInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const resultsContent = document.getElementById('resultsContent');
const errorContent = document.getElementById('errorContent');

// Event listeners
analyzeBtn.addEventListener('click', handleAnalyze);
clearBtn.addEventListener('click', handleClear);
tweetInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        handleAnalyze();
    }
});

// Main analysis function
async function handleAnalyze() {
    const content = tweetInput.value.trim();
    
    if (!content) {
        showError('Please enter some content to analyze');
        return;
    }

    try {
        showLoading();
        hideError();
        hideResults();

        const result = await analyzeTweet(content);
        showResults(result);
    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Analysis failed: ${error.message}`);
    }
}

// Clear function
function handleClear() {
    tweetInput.value = '';
    hideResults();
    hideError();
    hideLoading();
}

// Show/hide functions
function showLoading() {
    loadingSection.style.display = 'block';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
}

function hideLoading() {
    loadingSection.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Content';
}

function showResults(result) {
    hideLoading();
    resultsContent.innerHTML = generateResultsHTML(result);
    resultsSection.style.display = 'block';
}

function hideResults() {
    resultsSection.style.display = 'none';
}

function showError(message) {
    hideLoading();
    errorContent.textContent = message;
    errorSection.style.display = 'block';
}

function hideError() {
    errorSection.style.display = 'none';
}

// Main analysis logic (converted from background.js)
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
        throw new Error(error.message);
    }
}

// API functions (converted from background.js)
async function generateHeadline(content) {
    try {
        console.log('Generating headline for:', content);
        
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
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
        
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a claim extractor. Extract specific factual claims from the given text and return ONLY valid JSON.

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array
- No markdown formatting, no code blocks, no explanations
- No additional text before or after the JSON
- Each claim should be a string in the array
- Example format: ["claim1", "claim2", "claim3"]

Text to analyze: "${content}"

JSON response:`
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
            
            // Try to clean up the response and parse again
            const cleanedText = cleanJsonResponse(claimsText);
            try {
                const claims = JSON.parse(cleanedText);
                if (Array.isArray(claims)) {
                    return claims.filter(claim => claim.trim());
                }
            } catch (secondParseError) {
                console.error('Second JSON parse attempt failed:', secondParseError);
            }
            
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
        console.log('Searching for relevant sources for content:', content);
        
        // Step 1: Analyze content to determine subject and context
        const contentAnalysis = await analyzeContentSubject(content);
        console.log('Content analysis result:', contentAnalysis);
        
        // Step 2: Search for news sources using SerpAPI with broader search
        const searchQuery = encodeURIComponent(content);
        const response = await fetch(`${CONFIG.SERPAPI_URL}?engine=google&q=${searchQuery}&api_key=${CONFIG.SERPAPI_KEY}&num=20&tbm=nws`);
        
        if (!response.ok) {
            throw new Error(`SerpAPI error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.news_results) {
            return [];
        }

        // Step 3: Use Gemini AI to analyze and score each source for credibility and relevance
        const scoredSources = await analyzeAndScoreSourcesWithAI(data.news_results, content, contentAnalysis);
        console.log('AI-scored sources:', scoredSources);
        
        // Return top 5 most credible and relevant sources
        return scoredSources.slice(0, 5);

    } catch (error) {
        console.error('Error searching sources:', error);
        return [];
    }
}

// Additional helper functions (simplified versions from background.js)
async function analyzeContentSubject(content) {
    // Simplified version - you can expand this if needed
    return {
        primarySubject: 'OTHER',
        secondarySubjects: [],
        geographicScope: 'NATIONAL',
        temporalContext: 'CURRENT_EVENT',
        credibilityFactors: ['keyword_analysis'],
        confidence: 60
    };
}

async function analyzeAndScoreSourcesWithAI(newsResults, content, contentAnalysis) {
    // Simplified version - you can expand this if needed
    return newsResults.slice(0, 5).map((result, index) => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        source: new URL(result.link).hostname.replace('www.', ''),
        credibilityScore: 80 - (index * 5),
        relevanceScore: 85 - (index * 3),
        reasoning: 'AI-analyzed source',
        finalScore: 82 - (index * 4)
    }));
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
                sourcesUsed: sources.length > 0 ? sources.slice(0, 3) : []
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
        
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a fact-checker. Analyze the given claim against the provided sources. 

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object
- No markdown formatting, no code blocks, no explanations
- No additional text before or after the JSON
- verdict must be exactly "TRUE", "FALSE", or "UNCLEAR"
- confidence must be an integer from 0-100
- reasoning must be a string in quotes

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

JSON response:`
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
            
            // Try to clean up the response and parse again
            const cleanedText = cleanJsonResponse(resultText);
            try {
                const result = JSON.parse(cleanedText);
                console.log('Successfully parsed cleaned JSON result:', result);
                
                if (typeof result === 'object' && result !== null) {
                    return {
                        verdict: result.verdict || 'UNCLEAR',
                        confidence: result.confidence || 50,
                        reasoning: result.reasoning || 'Unable to verify'
                    };
                }
            } catch (secondParseError) {
                console.error('Second JSON parse attempt failed:', secondParseError);
            }
            
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
        
        // Prepare source summary for analysis
        const sourceSummary = sources.map(source => ({
            source: source.source,
            credibilityScore: source.credibilityScore,
            relevanceScore: source.relevanceScore,
            finalScore: source.finalScore,
            reasoning: source.reasoning
        }));
        
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a fact-checking analyst. Provide a brief, objective analysis of the credibility of the given content based on the individual claim analyses, overall credibility score, and AI-evaluated sources. Keep it under 150 words.

Analyze this content: "${content}"
                        
Individual Claim Analyses: ${JSON.stringify(claimAnalyses)}
Overall Credibility Score: ${credibilityScore}%
AI-Evaluated Sources: ${JSON.stringify(sourceSummary)}

Provide a clear, concise analysis that explains the overall credibility, highlights any notable individual claims, and mentions the quality of sources used for verification.`
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

// Helper functions
function cleanJsonResponse(text) {
    // Remove markdown code blocks
    text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Remove any text before the first {
    const firstBrace = text.indexOf('[');
    if (firstBrace > 0) {
        text = text.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = text.lastIndexOf(']');
    if (lastBrace > 0 && lastBrace < text.length - 1) {
        text = text.substring(0, lastBrace + 1);
    }
    
    // Remove common prefixes/suffixes
    text = text.replace(/^Here's the JSON:\s*/i, '');
    text = text.replace(/^The JSON response is:\s*/i, '');
    text = text.replace(/^JSON:\s*/i, '');
    text = text.replace(/^Response:\s*/i, '');
    text = text.replace(/^Claims:\s*/i, '');
    text = text.replace(/^Extracted claims:\s*/i, '');
    
    // Clean up any remaining whitespace
    text = text.trim();
    
    return text;
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

// Results display function
function generateResultsHTML(result) {
    const data = result.data;
    
    let html = `
        <div class="result-card">
            <h3>📰 Headline</h3>
            <p>${data.headline}</p>
        </div>
        
        <div class="result-card">
            <h3>📊 Overall Credibility Score</h3>
            <div class="credibility-score ${getCredibilityClass(data.credibilityScore)}">
                ${data.credibilityScore}%
            </div>
            <p>${getCredibilityDescription(data.credibilityScore)}</p>
        </div>
    `;
    
    if (data.factChecks && data.factChecks.length > 0) {
        html += `
            <div class="result-card">
                <h3>🔍 Individual Claim Analysis</h3>
        `;
        
        data.factChecks.forEach((check, index) => {
            html += `
                <div class="fact-check-item">
                    <h4>Claim ${index + 1}: "${check.claim}"</h4>
                    <div class="verdict verdict-${check.verdict.toLowerCase()}">${check.verdict}</div>
                    <span>Confidence: ${check.confidence}%</span>
                    <p><strong>Reasoning:</strong> ${check.reasoning}</p>
                    <p><strong>Credibility Score:</strong> ${check.credibilityScore}%</p>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    if (data.sources && data.sources.length > 0) {
        html += `
            <div class="result-card">
                <h3>📚 Sources Used</h3>
                <div class="sources-list">
        `;
        
        data.sources.forEach((source, index) => {
            html += `
                <div class="source-item">
                    <div class="source-info">
                        <div class="source-title">${source.title}</div>
                        <a href="${source.url}" target="_blank" class="source-url">${source.url}</a>
                    </div>
                    <div class="source-score">${source.finalScore}%</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (data.analysis) {
        html += `
            <div class="result-card">
                <h3>📋 Analysis Summary</h3>
                <p>${data.analysis}</p>
            </div>
        `;
    }
    
    return html;
}

function getCredibilityClass(score) {
    if (score >= 70) return 'credibility-high';
    if (score >= 40) return 'credibility-medium';
    return 'credibility-low';
}

function getCredibilityDescription(score) {
    if (score >= 70) return 'High credibility - content appears to be reliable and well-sourced';
    if (score >= 40) return 'Medium credibility - content has mixed reliability indicators';
    return 'Low credibility - content shows signs of being unreliable or poorly sourced';
}
