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
        console.log('Searching for credible sources for content:', content);
        
        // Step 1: Analyze content to determine subject and context
        const contentAnalysis = await analyzeContentSubject(content);
        console.log('Content analysis result:', contentAnalysis);
        
        // Step 2: Get subject-specific credible sources
        const credibleSources = getSubjectSpecificCredibleSources(contentAnalysis);
        console.log('Subject-specific credible sources:', credibleSources);
        
        // Step 3: Search for news sources using SerpAPI
        const searchQuery = encodeURIComponent(content);
        const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${searchQuery}&api_key=${SERPAPI_KEY}&num=15&tbm=nws`);
        
        if (!response.ok) {
            throw new Error(`SerpAPI error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.news_results) {
            return [];
        }

        // Step 4: Score and rank sources based on subject relevance and credibility
        const scoredSources = scoreAndRankSources(data.news_results, credibleSources, contentAnalysis);
        console.log('Scored and ranked sources:', scoredSources);
        
        // Return top 5 most credible and relevant sources
        return scoredSources.slice(0, 5);

    } catch (error) {
        console.error('Error searching sources:', error);
        return [];
    }
}

async function analyzeContentSubject(content) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze the given content and determine its primary subject matter and context. Return ONLY a JSON object with this exact format:

{
    "primarySubject": "POLITICS/SPORTS/SCIENCE/HEALTH/BUSINESS/TECHNOLOGY/ENTERTAINMENT/INTERNATIONAL/ENVIRONMENT/EDUCATION/OTHER",
    "secondarySubjects": ["subject1", "subject2"],
    "geographicScope": "LOCAL/REGIONAL/NATIONAL/INTERNATIONAL",
    "temporalContext": "CURRENT_EVENT/HISTORICAL/PREDICTIVE",
    "credibilityFactors": ["factor1", "factor2"],
    "confidence": 0-100
}

Analyze this content: "${content}"

Respond with ONLY the JSON object:`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 300,
                    temperature: 0.1
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text.trim();
        
        try {
            const result = JSON.parse(resultText);
            return {
                primarySubject: result.primarySubject || 'OTHER',
                secondarySubjects: result.secondarySubjects || [],
                geographicScope: result.geographicScope || 'NATIONAL',
                temporalContext: result.temporalContext || 'CURRENT_EVENT',
                credibilityFactors: result.credibilityFactors || [],
                confidence: result.confidence || 50
            };
        } catch (parseError) {
            console.error('JSON parse error for content analysis:', parseError);
            // Fallback: basic content analysis
            return analyzeContentFallback(content);
        }
    } catch (error) {
        console.error('Error analyzing content subject:', error);
        return analyzeContentFallback(content);
    }
}

function analyzeContentFallback(content) {
    // Simple keyword-based fallback analysis
    const text = content.toLowerCase();
    
    let primarySubject = 'OTHER';
    let geographicScope = 'NATIONAL';
    
    // Subject detection
    if (text.includes('president') || text.includes('congress') || text.includes('election') || text.includes('politics')) {
        primarySubject = 'POLITICS';
    } else if (text.includes('sport') || text.includes('game') || text.includes('team') || text.includes('player')) {
        primarySubject = 'SPORTS';
    } else if (text.includes('study') || text.includes('research') || text.includes('scientist') || text.includes('discovery')) {
        primarySubject = 'SCIENCE';
    } else if (text.includes('health') || text.includes('medical') || text.includes('disease') || text.includes('treatment')) {
        primarySubject = 'HEALTH';
    } else if (text.includes('business') || text.includes('economy') || text.includes('market') || text.includes('company')) {
        primarySubject = 'BUSINESS';
    } else if (text.includes('tech') || text.includes('technology') || text.includes('ai') || text.includes('software')) {
        primarySubject = 'TECHNOLOGY';
    }
    
    // Geographic scope detection
    if (text.includes('world') || text.includes('international') || text.includes('global')) {
        geographicScope = 'INTERNATIONAL';
    } else if (text.includes('local') || text.includes('city') || text.includes('town')) {
        geographicScope = 'LOCAL';
    }
    
    return {
        primarySubject: primarySubject,
        secondarySubjects: [],
        geographicScope: geographicScope,
        temporalContext: 'CURRENT_EVENT',
        credibilityFactors: ['keyword_analysis'],
        confidence: 60
    };
}

function getSubjectSpecificCredibleSources(contentAnalysis) {
    const { primarySubject, geographicScope } = contentAnalysis;
    
    // Base credible sources that are generally reliable across subjects
    const baseSources = {
        'reuters.com': { credibility: 95, subjects: ['ALL'], scope: 'INTERNATIONAL' },
        'ap.org': { credibility: 95, subjects: ['ALL'], scope: 'INTERNATIONAL' },
        'bbc.com': { credibility: 90, subjects: ['ALL'], scope: 'INTERNATIONAL' },
        'npr.org': { credibility: 88, subjects: ['ALL'], scope: 'NATIONAL' }
    };
    
    // Subject-specific credible sources
    const subjectSources = {
        'POLITICS': {
            'nytimes.com': { credibility: 88, subjects: ['POLITICS'], scope: 'NATIONAL' },
            'washingtonpost.com': { credibility: 87, subjects: ['POLITICS'], scope: 'NATIONAL' },
            'wsj.com': { credibility: 85, subjects: ['POLITICS', 'BUSINESS'], scope: 'NATIONAL' },
            'politico.com': { credibility: 82, subjects: ['POLITICS'], scope: 'NATIONAL' },
            'thehill.com': { credibility: 80, subjects: ['POLITICS'], scope: 'NATIONAL' },
            'rollcall.com': { credibility: 78, subjects: ['POLITICS'], scope: 'NATIONAL' }
        },
        'SPORTS': {
            'espn.com': { credibility: 85, subjects: ['SPORTS'], scope: 'INTERNATIONAL' },
            'sportsillustrated.com': { credibility: 82, subjects: ['SPORTS'], scope: 'INTERNATIONAL' },
            'bleacherreport.com': { credibility: 75, subjects: ['SPORTS'], scope: 'INTERNATIONAL' },
            'cbssports.com': { credibility: 78, subjects: ['SPORTS'], scope: 'INTERNATIONAL' },
            'nbcnews.com/sports': { credibility: 80, subjects: ['SPORTS'], scope: 'INTERNATIONAL' }
        },
        'SCIENCE': {
            'nature.com': { credibility: 98, subjects: ['SCIENCE'], scope: 'INTERNATIONAL' },
            'science.org': { credibility: 98, subjects: ['SCIENCE'], scope: 'INTERNATIONAL' },
            'cell.com': { credibility: 95, subjects: ['SCIENCE'], scope: 'INTERNATIONAL' },
            'thelancet.com': { credibility: 95, subjects: ['SCIENCE', 'HEALTH'], scope: 'INTERNATIONAL' },
            'nejm.org': { credibility: 95, subjects: ['SCIENCE', 'HEALTH'], scope: 'INTERNATIONAL' },
            'scientificamerican.com': { credibility: 88, subjects: ['SCIENCE'], scope: 'INTERNATIONAL' },
            'phys.org': { credibility: 85, subjects: ['SCIENCE'], scope: 'INTERNATIONAL' }
        },
        'HEALTH': {
            'who.int': { credibility: 98, subjects: ['HEALTH'], scope: 'INTERNATIONAL' },
            'cdc.gov': { credibility: 98, subjects: ['HEALTH'], scope: 'NATIONAL' },
            'nih.gov': { credibility: 95, subjects: ['HEALTH', 'SCIENCE'], scope: 'NATIONAL' },
            'mayoclinic.org': { credibility: 92, subjects: ['HEALTH'], scope: 'NATIONAL' },
            'webmd.com': { credibility: 80, subjects: ['HEALTH'], scope: 'NATIONAL' },
            'healthline.com': { credibility: 78, subjects: ['HEALTH'], scope: 'NATIONAL' }
        },
        'BUSINESS': {
            'wsj.com': { credibility: 90, subjects: ['BUSINESS'], scope: 'INTERNATIONAL' },
            'bloomberg.com': { credibility: 88, subjects: ['BUSINESS'], scope: 'INTERNATIONAL' },
            'ft.com': { credibility: 87, subjects: ['BUSINESS'], scope: 'INTERNATIONAL' },
            'economist.com': { credibility: 85, subjects: ['BUSINESS'], scope: 'INTERNATIONAL' },
            'forbes.com': { credibility: 80, subjects: ['BUSINESS'], scope: 'INTERNATIONAL' },
            'cnbc.com': { credibility: 78, subjects: ['BUSINESS'], scope: 'NATIONAL' }
        },
        'TECHNOLOGY': {
            'techcrunch.com': { credibility: 82, subjects: ['TECHNOLOGY'], scope: 'INTERNATIONAL' },
            'wired.com': { credibility: 85, subjects: ['TECHNOLOGY'], scope: 'INTERNATIONAL' },
            'ars-technica.com': { credibility: 83, subjects: ['TECHNOLOGY'], scope: 'INTERNATIONAL' },
            'theverge.com': { credibility: 80, subjects: ['TECHNOLOGY'], scope: 'INTERNATIONAL' },
            'engadget.com': { credibility: 78, subjects: ['TECHNOLOGY'], scope: 'INTERNATIONAL' },
            'cnet.com': { credibility: 75, subjects: ['TECHNOLOGY'], scope: 'NATIONAL' }
        },
        'INTERNATIONAL': {
            'reuters.com': { credibility: 95, subjects: ['INTERNATIONAL'], scope: 'INTERNATIONAL' },
            'bbc.com': { credibility: 90, subjects: ['INTERNATIONAL'], scope: 'INTERNATIONAL' },
            'ap.org': { credibility: 95, subjects: ['INTERNATIONAL'], scope: 'INTERNATIONAL' },
            'aljazeera.com': { credibility: 80, subjects: ['INTERNATIONAL'], scope: 'INTERNATIONAL' },
            'dw.com': { credibility: 85, subjects: ['INTERNATIONAL'], scope: 'INTERNATIONAL' },
            'france24.com': { credibility: 82, subjects: ['INTERNATIONAL'], scope: 'INTERNATIONAL' }
        }
    };
    
    // Combine base sources with subject-specific sources
    const allSources = { ...baseSources };
    
    if (subjectSources[primarySubject]) {
        Object.assign(allSources, subjectSources[primarySubject]);
    }
    
    // Add secondary subject sources if they exist
    contentAnalysis.secondarySubjects.forEach(subject => {
        if (subjectSources[subject]) {
            Object.assign(allSources, subjectSources[subject]);
        }
    });
    
    return allSources;
}

function scoreAndRankSources(newsResults, credibleSources, contentAnalysis) {
    return newsResults
        .map(result => {
            const domain = new URL(result.link).hostname.replace('www.', '');
            const sourceInfo = credibleSources[domain];
            
            let credibilityScore = 0;
            let relevanceScore = 0;
            let finalScore = 0;
            
            if (sourceInfo) {
                // High credibility if source is in our credible list
                credibilityScore = sourceInfo.credibility;
                
                // Bonus for subject relevance
                if (sourceInfo.subjects.includes('ALL') || sourceInfo.subjects.includes(contentAnalysis.primarySubject)) {
                    relevanceScore += 20;
                }
                
                // Bonus for geographic scope match
                if (sourceInfo.scope === contentAnalysis.geographicScope || sourceInfo.scope === 'INTERNATIONAL') {
                    relevanceScore += 15;
                }
            } else {
                // Lower credibility for unknown sources
                credibilityScore = 40;
                
                // Try to infer credibility from domain patterns
                if (domain.includes('.edu') || domain.includes('.gov')) {
                    credibilityScore += 20;
                } else if (domain.includes('news') || domain.includes('times') || domain.includes('post')) {
                    credibilityScore += 10;
                }
            }
            
            // Calculate final score (70% credibility + 30% relevance)
            finalScore = (credibilityScore * 0.7) + (relevanceScore * 0.3);
            
            return {
                title: result.title,
                url: result.link,
                snippet: result.snippet,
                source: domain,
                credibilityScore: Math.round(credibilityScore),
                relevanceScore: Math.round(relevanceScore),
                finalScore: Math.round(finalScore),
                sourceInfo: sourceInfo || null
            };
        })
        .filter(result => result.finalScore >= 50) // Only include reasonably credible sources
        .sort((a, b) => b.finalScore - a.finalScore); // Sort by final score descending
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

//FOR LATER, may need some improvements
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