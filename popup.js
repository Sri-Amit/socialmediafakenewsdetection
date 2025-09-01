document.addEventListener('DOMContentLoaded', function() {
    const tweetText = document.getElementById('tweetText');
    const analyzeCurrentBtn = document.getElementById('analyzeCurrent');
    const analyzePastedBtn = document.getElementById('analyzePasted');
    const resultsSection = document.getElementById('results');
    const loading = document.getElementById('loading');
    const analysisResults = document.getElementById('analysisResults');
    const autoAnalyzeCheckbox = document.getElementById('autoAnalyze');
    const apiStatus = document.getElementById('apiStatus');
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');

    // Load saved settings
    chrome.storage.sync.get(['autoAnalyze'], function(result) {
        autoAnalyzeCheckbox.checked = result.autoAnalyze || false;
    });

    // Save settings when changed
    autoAnalyzeCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ autoAnalyze: this.checked });
    });

    // Analyze current tweet button
    analyzeCurrentBtn.addEventListener('click', async function() {
        try {
            setStatus('Analyzing current tweet...', 'warning');
            
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                showError('Please navigate to Twitter/X to analyze a tweet');
                return;
            }

            // Inject script to get tweet content
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: getCurrentTweetContent
            });

            const tweetContent = results[0].result;
            
            if (!tweetContent) {
                showError('No tweet found. Please make sure you are viewing a tweet.');
                return;
            }

            tweetText.value = tweetContent;
            await analyzeTweet(tweetContent);
            
        } catch (error) {
            console.error('Error analyzing current tweet:', error);
            showError('Failed to analyze current tweet. Please try again.');
        }
    });

    // Analyze pasted text button
    analyzePastedBtn.addEventListener('click', async function() {
        const content = tweetText.value.trim();
        
        if (!content) {
            showError('Please enter some text to analyze');
            return;
        }

        await analyzeTweet(content);
    });

    async function analyzeTweet(content) {
        try {
            showLoading();
            setStatus('Analyzing...', 'warning');

            // Send message to background script for analysis
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeTweet',
                content: content
            });

            if (response.success) {
                displayResults(response.data);
                setStatus('Analysis complete', 'success');
            } else {
                showError(response.error || 'Analysis failed');
                setStatus('Analysis failed', 'error');
            }
            
        } catch (error) {
            console.error('Error during analysis:', error);
            showError('Failed to analyze tweet. Please check your API keys.');
            setStatus('API Error', 'error');
        }
    }

    function showLoading() {
        resultsSection.style.display = 'block';
        loading.style.display = 'block';
        analysisResults.style.display = 'none';
    }

    function displayResults(data) {
        loading.style.display = 'none';
        analysisResults.style.display = 'block';

        // Display headline
        document.getElementById('headline').textContent = data.headline || 'No headline generated';

        // Display credibility score
        const score = data.credibilityScore || 0;
        const scoreFill = document.getElementById('scoreFill');
        const scoreText = document.getElementById('scoreText');
        
        scoreFill.style.width = `${score}%`;
        scoreText.textContent = `${score}%`;
        
        // Color code the score
        if (score >= 70) {
            scoreText.style.color = '#28a745';
        } else if (score >= 40) {
            scoreText.style.color = '#ffc107';
        } else {
            scoreText.style.color = '#dc3545';
        }

        // Display individual claim analyses with credibility scores
        const factCheckContainer = document.getElementById('factCheckResults');
        factCheckContainer.innerHTML = '';
        
        if (data.factChecks && data.factChecks.length > 0) {
            data.factChecks.forEach(claimAnalysis => {
                const item = document.createElement('div');
                item.className = 'fact-check-item';
                
                // Create claim header with verdict icon
                const claimHeader = document.createElement('div');
                claimHeader.className = 'claim-header';
                
                const icon = document.createElement('div');
                icon.className = `fact-check-icon ${claimAnalysis.verdict.toLowerCase()}`;
                icon.textContent = claimAnalysis.verdict === 'TRUE' ? '✓' : claimAnalysis.verdict === 'FALSE' ? '✗' : '?';
                
                const claimText = document.createElement('span');
                claimText.className = 'claim-text';
                claimText.textContent = claimAnalysis.claim;
                
                claimHeader.appendChild(icon);
                claimHeader.appendChild(claimText);
                item.appendChild(claimHeader);
                
                // Create credibility score display
                const scoreDisplay = document.createElement('div');
                scoreDisplay.className = 'claim-credibility';
                
                const scoreLabel = document.createElement('span');
                scoreLabel.textContent = 'Credibility: ';
                scoreLabel.className = 'score-label';
                
                const scoreValue = document.createElement('span');
                scoreValue.textContent = `${claimAnalysis.credibilityScore}%`;
                scoreValue.className = 'score-value';
                
                // Color code individual claim scores
                if (claimAnalysis.credibilityScore >= 70) {
                    scoreValue.style.color = '#28a745';
                } else if (claimAnalysis.credibilityScore >= 40) {
                    scoreValue.style.color = '#ffc107';
                } else {
                    scoreValue.style.color = '#dc3545';
                }
                
                scoreDisplay.appendChild(scoreLabel);
                scoreDisplay.appendChild(scoreValue);
                item.appendChild(scoreDisplay);
                
                // Add reasoning if available
                if (claimAnalysis.reasoning) {
                    const reasoning = document.createElement('div');
                    reasoning.className = 'claim-reasoning';
                    reasoning.textContent = claimAnalysis.reasoning;
                    item.appendChild(reasoning);
                }
                
                factCheckContainer.appendChild(item);
            });
        } else {
            factCheckContainer.innerHTML = '<p>No specific claims found to analyze</p>';
        }

        // Display analysis details
        const detailsContainer = document.getElementById('analysisDetails');
        detailsContainer.innerHTML = '';
        
        if (data.analysis) {
            const details = document.createElement('p');
            details.textContent = data.analysis;
            detailsContainer.appendChild(details);
        }

        if (data.sources && data.sources.length > 0) {
            const sourcesTitle = document.createElement('h4');
            sourcesTitle.textContent = 'Sources:';
            sourcesTitle.style.marginTop = '10px';
            sourcesTitle.style.fontSize = '12px';
            sourcesTitle.style.color = '#6c757d';
            detailsContainer.appendChild(sourcesTitle);
            
            data.sources.forEach(source => {
                const sourceLink = document.createElement('a');
                sourceLink.href = source.url;
                sourceLink.textContent = source.title || source.url;
                sourceLink.target = '_blank';
                sourceLink.style.display = 'block';
                sourceLink.style.fontSize = '12px';
                sourceLink.style.color = '#667eea';
                sourceLink.style.textDecoration = 'none';
                sourceLink.style.marginTop = '5px';
                detailsContainer.appendChild(sourceLink);
            });
        }
    }

    function showError(message) {
        loading.style.display = 'none';
        analysisResults.style.display = 'none';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        resultsSection.appendChild(errorDiv);
        resultsSection.style.display = 'block';
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    function setStatus(text, type) {
        statusText.textContent = text;
        statusDot.className = 'status-dot';
        
        if (type === 'error') {
            statusDot.classList.add('error');
        } else if (type === 'warning') {
            statusDot.classList.add('warning');
        }
    }
});

// Function to be injected into the page to get tweet content
function getCurrentTweetContent() {
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