// Popup script for the fact checker extension
class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    await this.loadSubscriptionStatus();
    await this.loadUsageInfo();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Settings management
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Fast mode toggle
    document.getElementById('fastMode').addEventListener('change', (e) => {
      const showImagesCheckbox = document.getElementById('showImages');
      if (e.target.checked) {
        showImagesCheckbox.checked = false;
        showImagesCheckbox.disabled = true;
      } else {
        showImagesCheckbox.disabled = false;
      }
    });

    // Upgrade button
    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upgrade button clicked');
        this.launchUpgradeFlow();
      });
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'autoCheck',
        'showImages',
        'fastMode'
      ]);

      // Load settings
      document.getElementById('autoCheck').checked = result.autoCheck || false;
      document.getElementById('showImages').checked = result.showImages !== false; // Default to true
      document.getElementById('fastMode').checked = result.fastMode || false;
      
      // Update image setting based on fast mode
      if (result.fastMode) {
        document.getElementById('showImages').checked = false;
        document.getElementById('showImages').disabled = true;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['stats']);
      const stats = result.stats || { totalChecks: 0, todayChecks: 0, lastCheckDate: null };

      // Update today's count if it's a new day
      const today = new Date().toDateString();
      if (stats.lastCheckDate !== today) {
        stats.todayChecks = 0;
        stats.lastCheckDate = today;
        await chrome.storage.local.set({ stats });
      }

      document.getElementById('totalChecks').textContent = stats.totalChecks;
      document.getElementById('todayChecks').textContent = stats.todayChecks;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }


  async saveSettings() {
    try {
      const fastMode = document.getElementById('fastMode').checked;
      const settings = {
        autoCheck: document.getElementById('autoCheck').checked,
        showImages: fastMode ? false : document.getElementById('showImages').checked,
        fastMode: fastMode
      };

      await chrome.storage.sync.set(settings);
      this.showStatus('Settings saved successfully', 'success');

      // Notify content scripts of settings change
      const tabs = await chrome.tabs.query({
        url: [
          'https://twitter.com/*',
          'https://x.com/*',
          'https://www.instagram.com/*',
          'https://www.facebook.com/*'
        ]
      });

      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: settings
          });
        } catch (error) {
          // Ignore errors for tabs that don't have content script loaded
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }


  showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.classList.remove('hidden');

    // Hide status after 3 seconds
    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, 3000);
  }

  async loadSubscriptionStatus() {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getSubscriptionStatus' }, resolve);
      });

      const statusElement = document.getElementById('subscriptionStatus');
      const upgradeSection = document.getElementById('upgradeSection');
      
      if (response && response.isPro) {
        statusElement.innerHTML = `
          <div class="status-text">
            ✅ Pro Plan Active
          </div>
        `;
        upgradeSection.style.display = 'none';
      } else {
        statusElement.innerHTML = `
          <div class="status-text">
            📊 Free Plan - 5 checks per day
          </div>
        `;
        upgradeSection.style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  }

  async loadUsageInfo() {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'checkUsageLimit' }, resolve);
      });

      const usageInfo = document.getElementById('usageInfo');
      const remainingChecks = document.getElementById('remainingChecks');
      const planBadge = document.getElementById('planBadge');
      
      if (response && response.plan) {
        usageInfo.style.display = 'block';
        remainingChecks.textContent = response.remainingChecks || 0;
        planBadge.textContent = response.plan === 'pro' ? 'Pro Plan' : 'Free Plan';
        
        if (response.plan === 'pro') {
          planBadge.style.background = '#10b981';
        } else {
          planBadge.style.background = '#667eea';
        }
      }
    } catch (error) {
      console.error('Error loading usage info:', error);
    }
  }

  launchUpgradeFlow() {
    console.log('Opening billing page...');
    this.showStatus('Opening billing page...', 'success');
    
    chrome.runtime.sendMessage({ action: 'openBilling' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening billing page:', chrome.runtime.lastError);
        this.showStatus('Error opening billing page: ' + chrome.runtime.lastError.message, 'error');
      } else if (response && response.success) {
        console.log('Billing page opened successfully');
        this.showStatus('Billing page opened! Complete payment and sync your account.', 'success');
        
        // Start polling for plan changes
        this.startPollingForUpgrade();
      } else {
        console.error('Failed to open billing page:', response?.error);
        this.showStatus('Failed to open billing page: ' + (response?.error || 'Unknown error'), 'error');
      }
    });
  }

  startPollingForUpgrade() {
    const start = Date.now();
    const pollInterval = 5000; // 5 seconds
    const maxDuration = 120000; // 2 minutes
    
    const poll = async () => {
      try {
        // Check subscription status
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'getSubscriptionStatus' }, resolve);
        });
        
        if (response && response.isPro) {
          console.log('Pro plan detected!');
          this.showStatus('Pro plan activated!', 'success');
          // Reload the popup to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
        
        // Continue polling if we haven't exceeded the time limit
        if (Date.now() - start < maxDuration) {
          setTimeout(poll, pollInterval);
        } else {
          console.log('Polling timeout reached');
          this.showStatus('Upgrade timeout. Please refresh if you completed payment.', 'warning');
        }
      } catch (error) {
        console.error('Error polling for upgrade:', error);
        // Continue polling on error
        if (Date.now() - start < maxDuration) {
          setTimeout(poll, pollInterval);
        }
      }
    };
    
    // Start polling after a short delay
    setTimeout(poll, pollInterval);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
