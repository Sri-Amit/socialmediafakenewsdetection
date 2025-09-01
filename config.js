// Configuration file for Fake News Detector extension
// Copy this file to config.local.js and add your actual API keys

const config = {
    // Google Gemini API Configuration
    gemini: {
        apiKey: 'AIzaSyDaU5J4YTH70BihYb8QbGHjiK6negpX2os', // Replace with your actual Gemini API key
        model: 'gemini-1.5-flash',
        maxTokens: {
            headline: 50,
            claims: 200,
            factCheck: 300,
            analysis: 150
        },
        temperature: {
            headline: 0.3,
            claims: 0.1,
            factCheck: 0.1,
            analysis: 0.3
        }
    },

    // SerpAPI Configuration (Optional)
    serpapi: {
        apiKey: '2dac97bf1929796a23e3babe9480e1a4e5e060cf9ee9a96a2582c001b7e23623', // Replace with your actual SerpAPI key
        engine: 'google',
        numResults: 10,
        newsOnly: true
    },

    // Credible Sources Configuration
    credibleSources: [
        'reuters.com',
        'ap.org',
        'bbc.com',
        'npr.org',
        'pbs.org',
        'nytimes.com',
        'washingtonpost.com',
        'wsj.com',
        'usatoday.com',
        'cnn.com',
        'foxnews.com',
        'abcnews.go.com',
        'cbsnews.com',
        'nbcnews.com',
        'time.com',
        'newsweek.com',
        'theatlantic.com',
        'economist.com',
        'espn.com',
        'sports.yahoo.com',
        'scientificamerican.com',
        'nature.com',
        'science.org',
        'nature.com',
        'cell.com',
        'thelancet.com',
        'nejm.org',
        'jamanetwork.com'
    ],

    // Scoring Configuration
    scoring: {
        trueClaimWeight: 80, // Base score for true claims
        falseClaimWeight: 20, // Base score for false claims
        unclearClaimWeight: 50, // Base score for unclear claims
        sourceBonus: 5, // Bonus points per credible source
        maxSourceBonus: 20, // Maximum bonus from sources
        confidenceMultiplier: 0.2 // How much confidence affects score
    },

    // UI Configuration
    ui: {
        popupWidth: 400,
        popupHeight: 500,
        overlayMaxWidth: 200,
        modalMaxWidth: 500,
        colors: {
            credible: '#28a745',
            unclear: '#ffc107',
            fake: '#dc3545',
            primary: '#667eea',
            secondary: '#764ba2'
        }
    },

    // Feature Flags
    features: {
        autoAnalysis: false, // Default auto-analysis setting
        showOverlays: true,
        showDetailedAnalysis: true,
        enableSourceSearch: true
    },

    // Rate Limiting
    rateLimit: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        cooldownPeriod: 1000 // milliseconds between requests
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else if (typeof window !== 'undefined') {
    window.fakeNewsConfig = config;
} 