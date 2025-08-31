// Content script for Twitter/X pages

// Function to extract tweet content from the current page
function extractTweetContent() {
    // Try multiple selectors for different tweet formats
    const selectors = [
        '[data-testid="tweetText"]',
        '[data-testid="tweet"] [lang]',
        '.tweet-text',
        '.js-tweet-text',
        '[role="article"] [lang]'
    ];
    
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            // Get the most recent tweet (usually the first one)
            const tweetElement = elements[0];
            return tweetElement.textContent.trim();
        }
    }
    
    // Fallback: look for any text content in tweet-like containers
    const tweetContainers = document.querySelectorAll('[data-testid="tweet"], [role="article"]');
    for (const container of tweetContainers) {
        const textElements = container.querySelectorAll('p, span');
        let content = '';
        for (const element of textElements) {
            if (element.textContent.trim() && !element.querySelector('a')) {
                content += element.textContent.trim() + ' ';
            }
        }
        if (content.trim()) {
            return content.trim();
        }
    }
    
    return null;
}

// Function to add analysis overlay to tweets
function addAnalysisOverlay(tweetElement, analysisData) {
    // Remove existing overlay if present
    const existingOverlay = tweetElement.querySelector('.fake-news-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'fake-news-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 0 0 0 8px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        max-width: 200px;
        word-wrap: break-word;
    `;
    
    // Set overlay content based on credibility score
    const score = analysisData.credibilityScore;
    let color, text, icon;
    
    if (score >= 70) {
        color = '#28a745';
        text = 'Likely Credible';
        icon = '✅';
    } else if (score >= 40) {
        color = '#ffc107';
        text = 'Unclear';
        icon = '⚠️';
    } else {
        color = '#dc3545';
        text = 'Likely Fake';
        icon = '❌';
    }
    
    overlay.style.borderLeft = `4px solid ${color}`;
    overlay.innerHTML = `${icon} ${text} (${score}%)`;
    
    // Add click handler to show detailed analysis
    overlay.addEventListener('click', () => {
        showDetailedAnalysis(analysisData);
    });
    
    // Make tweet container relative positioned
    const tweetContainer = tweetElement.closest('[data-testid="tweet"], [role="article"]');
    if (tweetContainer) {
        tweetContainer.style.position = 'relative';
        tweetContainer.appendChild(overlay);
    }
}

// Function to show detailed analysis in a modal
function showDetailedAnalysis(analysisData) {
    // Remove existing modal
    const existingModal = document.querySelector('.fake-news-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fake-news-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;
    closeBtn.addEventListener('click', () => modal.remove());
    
    const score = analysisData.credibilityScore;
    let scoreColor, scoreText;
    
    if (score >= 70) {
        scoreColor = '#28a745';
        scoreText = 'Likely Credible';
    } else if (score >= 40) {
        scoreColor = '#ffc107';
        scoreText = 'Unclear';
    } else {
        scoreColor = '#dc3545';
        scoreText = 'Likely Fake';
    }
    
    modalContent.innerHTML = `
        <h2 style="margin-bottom: 16px; color: #333;">Fake News Analysis</h2>
        <div style="margin-bottom: 16px;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Headline Summary</h3>
            <p style="font-weight: bold; color: #333;">${analysisData.headline || 'No headline generated'}</p>
        </div>
        <div style="margin-bottom: 16px;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Credibility Score</h3>
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; background: ${scoreColor}; width: ${score}%;"></div>
                </div>
                <span style="font-weight: bold; color: ${scoreColor};">${score}% - ${scoreText}</span>
            </div>
        </div>
        ${analysisData.factChecks && analysisData.factChecks.length > 0 ? `
        <div style="margin-bottom: 16px;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Fact Check Results</h3>
            ${analysisData.factChecks.map(check => `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                    <span style="color: ${check.verdict === 'TRUE' ? '#28a745' : check.verdict === 'FALSE' ? '#dc3545' : '#ffc107'}; font-weight: bold;">
                        ${check.verdict === 'TRUE' ? '✓' : check.verdict === 'FALSE' ? '✗' : '?'}
                    </span>
                    <span style="font-size: 13px;">${check.claim}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
        ${analysisData.analysis ? `
        <div style="margin-bottom: 16px;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Analysis</h3>
            <p style="font-size: 14px; line-height: 1.5; color: #333;">${analysisData.analysis}</p>
        </div>
        ` : ''}
        ${analysisData.sources && analysisData.sources.length > 0 ? `
        <div>
            <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Sources</h3>
            ${analysisData.sources.map(source => `
                <a href="${source.url}" target="_blank" style="display: block; font-size: 13px; color: #667eea; text-decoration: none; margin-bottom: 4px;">
                    ${source.title || source.url}
                </a>
            `).join('')}
        </div>
        ` : ''}
    `;
    
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractTweet') {
        const content = extractTweetContent();
        sendResponse({ content });
    } else if (request.action === 'addAnalysis') {
        const tweetElements = document.querySelectorAll('[data-testid="tweet"], [role="article"]');
        if (tweetElements.length > 0) {
            addAnalysisOverlay(tweetElements[0], request.analysisData);
        }
        sendResponse({ success: true });
    }
});

// Auto-analysis feature (if enabled)
let autoAnalysisEnabled = false;

// Check if auto-analysis is enabled
chrome.storage.sync.get(['autoAnalyze'], function(result) {
    autoAnalysisEnabled = result.autoAnalyze || false;
    if (autoAnalysisEnabled) {
        setupAutoAnalysis();
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.autoAnalyze) {
        autoAnalysisEnabled = changes.autoAnalyze.newValue;
        if (autoAnalysisEnabled) {
            setupAutoAnalysis();
        } else {
            removeAutoAnalysis();
        }
    }
});

function setupAutoAnalysis() {
    // Add observer to detect new tweets
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tweetElements = node.querySelectorAll ? 
                        node.querySelectorAll('[data-testid="tweet"], [role="article"]') : [];
                    
                    if (node.matches && node.matches('[data-testid="tweet"], [role="article"]')) {
                        tweetElements.push(node);
                    }
                    
                    tweetElements.forEach(tweetElement => {
                        if (!tweetElement.querySelector('.fake-news-overlay')) {
                            const content = extractTweetContent();
                            if (content) {
                                // Send content to background script for analysis
                                chrome.runtime.sendMessage({
                                    action: 'analyzeTweet',
                                    content: content
                                }, (response) => {
                                    if (response.success) {
                                        addAnalysisOverlay(tweetElement, response.data);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Store observer reference for cleanup
    window.fakeNewsObserver = observer;
}

function removeAutoAnalysis() {
    if (window.fakeNewsObserver) {
        window.fakeNewsObserver.disconnect();
        window.fakeNewsObserver = null;
    }
    
    // Remove all overlays
    const overlays = document.querySelectorAll('.fake-news-overlay');
    overlays.forEach(overlay => overlay.remove());
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (autoAnalysisEnabled) {
            setupAutoAnalysis();
        }
    });
} else {
    if (autoAnalysisEnabled) {
        setupAutoAnalysis();
    }
} 