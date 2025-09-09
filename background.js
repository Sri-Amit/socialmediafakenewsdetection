// Background script for handling API calls and storage
chrome.runtime.onInstalled.addListener(() => {
  console.log('Social Media Fact Checker extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'factCheck') {
    handleFactCheck(request.data, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'ping') {
    // Respond to ping to verify extension context is valid
    sendResponse({ status: 'ok' });
    return false;
  }
});

async function handleFactCheck(data, sendResponse) {
  try {
    // Validate input data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided');
    }
    
    const { text, images, platform } = data;
    
    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('No text content found to analyze');
    }
    
    // Update usage statistics
    await updateStats();
    
    // OPTIMIZATION: Single combined analysis instead of per-claim analysis
    const factCheckResults = await performCombinedFactCheck(text, images || []);
    
    // The combined analysis already includes overall rating
    sendResponse({
      success: true,
      results: {
        claims: factCheckResults.claims,
        overallRating: factCheckResults.overallRating
      }
    });
    
    } catch (error) {
    console.error('Fact check error:', error);
    sendResponse({
      success: false,
      error: error.message || 'An unexpected error occurred'
    });
  }
}

// OPTIMIZED: Single API call for complete fact-checking
async function performCombinedFactCheck(text, images) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API key not configured');
  }
  
  // Sanitize text
  const sanitizedText = text.replace(/["\\]/g, '\\$&').substring(0, 2000);
  
  const prompt = `
    Use Google Search to analyze this social media post and provide a comprehensive fact-check with real, current sources.
    
    Post Text: "${sanitizedText}"
    ${images && images.length > 0 ? `Images: ${images.length} image(s) with extracted text` : ''}
    
    Search for current, authoritative sources to verify each claim. Use real-time information from:
    - Government websites (.gov)
    - Academic institutions (.edu)
    - Reputable news organizations (Reuters, AP, BBC, etc.)
    - Scientific journals and research papers
    - Fact-checking organizations (Snopes, PolitiFact, etc.)
    - International organizations (WHO, UN, etc.)
    
    Please provide a complete fact-check analysis in this JSON format:
    {
      "overallRating": 7,
      "overallConfidence": 0.8,
      "overallAssessment": "Likely True",
      "overallExplanation": "Most claims are well-supported by evidence",
      "claims": [
        {
          "claim": "The unemployment rate in the US is 3.5%",
          "rating": 8,
          "confidence": 0.9,
          "explanation": "This statistic is accurate according to recent BLS data",
          "sources": [
            {
              "url": "https://bls.gov/news.release/empsit.nr0.htm",
              "title": "Bureau of Labor Statistics Employment Situation",
              "credibilityScore": 10,
              "relevanceScore": 10,
              "summary": "Official government employment statistics"
            }
          ],
          "keyEvidence": ["Official BLS data", "Recent employment reports"]
        }
      ]
    }
    
    IMPORTANT: Only use real, accessible sources that actually exist. Do not make up or hallucinate sources.
    
    Focus on:
    1. Extract 2-4 most important factual claims
    2. Find 1-2 real, credible sources per claim using Google Search
    3. Rate each claim's credibility (1-10)
    4. Provide clear explanations based on actual sources
    5. Keep it concise but thorough
    
    Return ONLY valid JSON in the exact format shown above. Do not include any text before or after the JSON.
  `;
  
  try {
    const response = await callGeminiAPI(prompt, apiKey, 0, true); // Enable grounding for fact-checking
    const result = JSON.parse(cleanJsonResponse(response));
    
    // Validate and clean result
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format');
    }
    
    // Ensure we have the expected structure
    const factCheckResults = {
      overallRating: {
        rating: Math.max(1, Math.min(10, Math.round(result.overallRating || 5))),
        confidence: Math.max(0, Math.min(1, result.overallConfidence || 0.1)),
        assessment: result.overallAssessment || "Uncertain",
        explanation: (result.overallExplanation || 'Analysis completed').substring(0, 500)
      },
      claims: Array.isArray(result.claims) ? result.claims.map(claim => ({
        claim: (claim.claim || '').substring(0, 500),
        sources: Array.isArray(claim.sources) ? claim.sources.slice(0, 3).map(source => ({
          url: (source.url || '').substring(0, 500),
          title: (source.title || '').substring(0, 200),
          credibilityScore: Math.max(1, Math.min(10, Math.round(source.credibilityScore || 5))),
          relevanceScore: Math.max(1, Math.min(10, Math.round(source.relevanceScore || 5))),
          summary: (source.summary || '').substring(0, 300)
        })) : [],
        credibilityRating: {
          rating: Math.max(1, Math.min(10, Math.round(claim.rating || 5))),
          confidence: Math.max(0, Math.min(1, claim.confidence || 0.1)),
          explanation: (claim.explanation || 'No explanation provided').substring(0, 500),
          keyEvidence: Array.isArray(claim.keyEvidence) ? claim.keyEvidence.slice(0, 3) : []
        }
      })) : []
    };
    
    return factCheckResults;
  } catch (error) {
    console.error('Failed to parse combined fact-check JSON:', error);
    console.log('Raw response:', response);
    // Return fallback response
                return {
      overallRating: {
        rating: 5,
        confidence: 0.1,
        assessment: "Unable to analyze",
        explanation: "Error occurred during analysis"
      },
      claims: [{
        claim: "Unable to extract claims from this post",
        sources: [],
        credibilityRating: {
          rating: 5,
          confidence: 0.1,
          explanation: "Analysis failed",
          keyEvidence: []
        }
      }]
    };
  }
}

async function extractClaims(text, images) {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API key not configured');
  }
  
  // Sanitize text to prevent prompt injection
  const sanitizedText = text.replace(/["\\]/g, '\\$&').substring(0, 2000); // Limit length
  
  const prompt = `
    Analyze the following social media post and extract individual factual claims that can be verified.
    
    Text: "${sanitizedText}"
    ${images && images.length > 0 ? `Images: ${images.length} image(s) with extracted text` : ''}
    
    Return a JSON array of claims, where each claim is a clear, verifiable statement.
    Focus on factual claims that can be researched and verified, not opinions or subjective statements.
    
    Example format:
    [
      "The unemployment rate in the US is 3.5%",
      "Climate change is caused by human activities",
      "The COVID-19 vaccine has 95% efficacy"
    ]
  `;
  
  try {
    const response = await callGeminiAPI(prompt, apiKey);
    const claims = JSON.parse(cleanJsonResponse(response));
    
    // Validate response
    if (!Array.isArray(claims)) {
      throw new Error('Invalid response format');
    }
    
    // Filter and validate claims
    return claims.filter(claim => 
      claim && 
      typeof claim === 'string' && 
      claim.trim().length > 0 &&
      claim.trim().length < 500 // Reasonable length limit
    );
  } catch (error) {
    console.error('Failed to parse claims JSON:', error);
    console.log('Raw response:', response);
    // Return a fallback response
    return ["Unable to extract claims from this post"];
  }
}

async function findRelevantSources(claim) {
  // Validate input
  if (!claim || typeof claim !== 'string' || claim.trim().length === 0) {
    throw new Error('Invalid claim provided');
  }
  
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API key not configured');
  }
  
  // Sanitize claim to prevent prompt injection
  const sanitizedClaim = claim.replace(/["\\]/g, '\\$&').substring(0, 1000);
  
  const prompt = `
    Use Google Search to find current, authoritative sources that can verify or refute this claim: "${sanitizedClaim}"
    
    Search for recent, credible sources including:
    - Government websites (.gov)
    - Academic institutions (.edu) 
    - Reputable news organizations (Reuters, AP, BBC, etc.)
    - Scientific journals and research papers
    - International organizations (WHO, UN, etc.)
    - Fact-checking organizations (Snopes, PolitiFact, etc.)
    
    For each source found, provide:
    - URL (must be real and accessible)
    - Title (actual article/source title)
    - Credibility score (1-10 based on source reputation)
    - Relevance score (1-10 based on how directly it addresses the claim)
    - Summary (brief description of what the source says about the claim)
    
    IMPORTANT: Only include sources that actually exist and are accessible. Do not make up or hallucinate sources.
    
    Return ONLY a valid JSON array with this exact structure:
    [
      {
        "url": "https://real-source.com/article",
        "title": "Actual Article Title",
        "credibilityScore": 9,
        "relevanceScore": 8,
        "summary": "What this source says about the claim"
      }
    ]
    
    Do not include any text before or after the JSON array. Return only the JSON.
  `;
  
  try {
    const response = await callGeminiAPI(prompt, apiKey, 0, true); // Enable grounding
    const sources = JSON.parse(cleanJsonResponse(response));
    
    // Validate response
    if (!Array.isArray(sources)) {
      throw new Error('Invalid response format');
    }
    
    // Validate and clean sources
    return sources.filter(source => {
      return source && 
             typeof source === 'object' &&
             source.url && 
             source.title &&
             typeof source.credibilityScore === 'number' &&
             typeof source.relevanceScore === 'number' &&
             source.credibilityScore >= 1 && source.credibilityScore <= 10 &&
             source.relevanceScore >= 1 && source.relevanceScore <= 10;
    }).map(source => ({
      url: source.url.substring(0, 500), // Limit URL length
      title: source.title.substring(0, 200), // Limit title length
      credibilityScore: Math.round(source.credibilityScore),
      relevanceScore: Math.round(source.relevanceScore),
      summary: (source.summary || '').substring(0, 300) // Limit summary length
    }));
    } catch (error) {
    console.error('Failed to parse sources JSON:', error);
    console.log('Raw response:', response);
    // Return a fallback response
    return [{
      url: "https://example.com",
      title: "Unable to find sources",
      credibilityScore: 1,
      relevanceScore: 1,
      summary: "Error occurred while searching for sources"
    }];
  }
}

async function assessClaimCredibility(claim, sources) {
  // Validate inputs
  if (!claim || typeof claim !== 'string' || claim.trim().length === 0) {
    throw new Error('Invalid claim provided');
  }
  
  if (!Array.isArray(sources)) {
    sources = [];
  }
  
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API key not configured');
  }
  
  // Sanitize claim
  const sanitizedClaim = claim.replace(/["\\]/g, '\\$&').substring(0, 1000);
  
  // Build sources text safely
  const sourcesText = sources.map(s => {
    if (!s || typeof s !== 'object') return '';
    return `Source: ${(s.title || '').substring(0, 100)}\nURL: ${(s.url || '').substring(0, 100)}\nCredibility: ${s.credibilityScore || 1}/10\nRelevance: ${s.relevanceScore || 1}/10\nSummary: ${(s.summary || '').substring(0, 200)}`;
  }).filter(text => text.length > 0).join('\n\n');
  
  const prompt = `
    Based on the following sources, assess the credibility of this claim: "${sanitizedClaim}"
    
    Sources:
    ${sourcesText || 'No sources available'}
    
    Rate the claim's credibility on a scale of 1-10 where:
    1-3: Likely false or misleading
    4-6: Uncertain or mixed evidence
    7-10: Likely true or well-supported
    
    Provide your assessment in this JSON format:
    {
      "rating": 8,
      "confidence": 0.85,
      "explanation": "Detailed explanation of the assessment",
      "keyEvidence": ["Most important supporting evidence points"]
    }
  `;
  
  try {
    const response = await callGeminiAPI(prompt, apiKey);
    const result = JSON.parse(cleanJsonResponse(response));
    
    // Validate and clean result
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format');
    }
    
    return {
      rating: Math.max(1, Math.min(10, Math.round(result.rating || 5))),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.1)),
      explanation: (result.explanation || 'No explanation provided').substring(0, 500),
      keyEvidence: Array.isArray(result.keyEvidence) ? 
        result.keyEvidence.filter(item => typeof item === 'string').slice(0, 5) : 
        []
    };
    } catch (error) {
    console.error('Failed to parse credibility JSON:', error);
    console.log('Raw response:', response);
    // Return a fallback response
    return {
      rating: 5,
      confidence: 0.1,
      explanation: "Unable to assess credibility due to parsing error",
      keyEvidence: ["Assessment failed"]
    };
  }
}

function calculateOverallCredibility(factCheckResults) {
  if (factCheckResults.length === 0) {
    return { rating: 0, confidence: 0, explanation: "No claims to evaluate" };
  }
  
  // Weighted average based on confidence and number of sources
  let totalWeight = 0;
  let weightedSum = 0;
  
  factCheckResults.forEach(result => {
    const weight = result.credibilityRating.confidence * result.sources.length;
    weightedSum += result.credibilityRating.rating * weight;
    totalWeight += weight;
  });
  
  const overallRating = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Determine overall assessment
  let assessment = "Uncertain";
  if (overallRating >= 7) assessment = "Likely True";
  else if (overallRating <= 3) assessment = "Likely False";
  else assessment = "Mixed Evidence";
  
  return {
    rating: Math.round(overallRating * 10) / 10,
    confidence: Math.min(totalWeight / factCheckResults.length, 1),
    assessment,
    explanation: `Based on ${factCheckResults.length} claim(s) with ${Math.round(totalWeight)} total source weight`
  };
}

async function callGeminiAPI(prompt, apiKey, retryCount = 0, useGrounding = false) {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay
  
  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
                    }]
                }],
                generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    };

    // Add grounding tools if requested
    if (useGrounding) {
      requestBody.tools = [{
        google_search: {}
      }];
      // Remove responseMimeType when using grounding (not supported)
      delete requestBody.generationConfig.responseMimeType;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      if (response.status === 429 && retryCount < maxRetries) {
        // Rate limit hit - wait and retry with exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
        console.log(`Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGeminiAPI(prompt, apiKey, retryCount + 1, useGrounding);
      }
      
            const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
    return data.candidates[0].content.parts[0].text;
    } catch (error) {
    if (error.message.includes('429') && retryCount < maxRetries) {
      // Network error with 429 - retry with exponential backoff
      const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
      console.log(`Network error, retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiAPI(prompt, apiKey, retryCount + 1);
    }
    throw error;
  }
}

function cleanJsonResponse(response) {
  // Remove markdown code blocks and clean up the response
  let cleaned = response.trim();
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/```\s*$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If the response doesn't start with [ or {, try to find the JSON part
  if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
      cleaned = jsonMatch[1];
    }
  }
  
  // Additional cleaning for common JSON issues
  try {
    // Try to parse and re-stringify to validate and clean
    const parsed = JSON.parse(cleaned);
    return JSON.stringify(parsed);
  } catch (error) {
    // If parsing fails, try to fix common issues
    console.warn('JSON parsing failed, attempting to fix:', error.message);
    
    // Fix common issues:
    // 1. Unescaped quotes in strings
    cleaned = cleaned.replace(/([^\\])"([^"]*)"([^,}\]]*)/g, (match, before, content, after) => {
      // Only fix if it looks like an unescaped quote in a string value
      if (before.match(/[:\s]/) && after.match(/[,}\]]/)) {
        const escapedContent = content.replace(/"/g, '\\"');
        return `${before}"${escapedContent}"${after}`;
      }
      return match;
    });
    
    // 2. Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // 3. Fix missing quotes around keys
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // 4. Remove any non-JSON content that might be mixed in
    const lines = cleaned.split('\n');
    const jsonLines = [];
    let inJson = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        inJson = true;
      }
      if (inJson) {
        jsonLines.push(line);
        if (trimmed.endsWith(']') || trimmed.endsWith('}')) {
          break;
        }
      }
    }
    
    if (jsonLines.length > 0) {
      cleaned = jsonLines.join('\n');
    }
    
    return cleaned;
  }
}

async function getApiKey() {
  // Get API key from config (which reads from environment variables)
  if (typeof window !== 'undefined' && window.fakeNewsConfig) {
    return window.fakeNewsConfig.gemini.apiKey;
  }
  
  // Fallback for development
  return 'AIzaSyDaU5J4YTH70BihYb8QbGHjiK6negpX2os';
}

async function updateStats() {
  try {
    const result = await chrome.storage.local.get(['stats']);
    const stats = result.stats || { totalChecks: 0, todayChecks: 0, lastCheckDate: null };
    
    const today = new Date().toDateString();
    
    // Reset today's count if it's a new day
    if (stats.lastCheckDate !== today) {
      stats.todayChecks = 0;
      stats.lastCheckDate = today;
    }
    
    // Increment counters
    stats.totalChecks += 1;
    stats.todayChecks += 1;
    
    await chrome.storage.local.set({ stats });
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}
