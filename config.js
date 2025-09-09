// Configuration file for Fake News Detector extension
// This file reads from environment variables for security

// Load environment variables (for development)
// In production, these should be set by the build process or extension environment
const getEnvVar = (name, defaultValue = '') => {
  // Try to get from environment (if available)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  
  // Try to get from window (if set by build process)
  if (typeof window !== 'undefined' && window.env && window.env[name]) {
    return window.env[name];
  }
  
  // Return default value
  return defaultValue;
};

const config = {
    // Google Gemini API Configuration
    gemini: {
        apiKey: getEnvVar('GEMINI_API_KEY', 'AIzaSyDaU5J4YTH70BihYb8QbGHjiK6negpX2os'), // Fallback for development
        model: 'gemini-2.5-flash',
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
