// Popup script for the fact checker extension
class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
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
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
