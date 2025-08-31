# Installation Guide for Fake News Detector

## Quick Setup

### Step 1: Get API Keys

1. **OpenAI API Key** (Required)
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Sign up or log in
   - Go to "API Keys" section
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **SerpAPI Key** (Optional but recommended)
   - Go to [SerpAPI](https://serpapi.com/)
   - Sign up for a free account
   - Get your API key from the dashboard
   - Copy the key

### Step 2: Configure the Extension

1. **Edit the configuration file**
   - Open `background.js` in a text editor
   - Find these lines:
     ```javascript
     const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
     const SERPAPI_KEY = 'YOUR_SERPAPI_KEY';
     ```
   - Replace with your actual API keys:
     ```javascript
     const OPENAI_API_KEY = 'sk-your-actual-openai-key-here';
     const SERPAPI_KEY = 'your-actual-serpapi-key-here';
     ```

### Step 3: Load Extension in Chrome

1. **Open Chrome Extensions**
   - Open Chrome browser
   - Type `chrome://extensions/` in the address bar
   - Press Enter

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the extension folder
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - You should see "Fake News Detector for Twitter" in your extensions list
   - The extension icon should appear in your browser toolbar

### Step 4: Test the Extension

1. **Go to Twitter**
   - Navigate to [Twitter](https://twitter.com) or [X](https://x.com)
   - Find a tweet with some news or claims

2. **Analyze a Tweet**
   - Click the extension icon in your toolbar
   - Click "Analyze Current Tweet"
   - Wait for the analysis to complete

3. **Check Results**
   - You should see a credibility score
   - Fact-check results should appear
   - Sources should be listed

## Troubleshooting

### Extension Not Loading
- Make sure all files are in the same folder
- Check that `manifest.json` is properly formatted
- Verify Chrome is up to date

### API Errors
- Double-check your API keys are correct
- Ensure you have credits in your OpenAI account
- Check your internet connection

### No Analysis Results
- Make sure you're on a Twitter/X page
- Verify the tweet contains text content
- Check browser console for error messages

## API Usage Costs

### OpenAI Costs
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Typical analysis: 500-1000 tokens
- Cost per analysis: ~$0.001-0.002

### SerpAPI Costs
- Free tier: 100 searches per month
- Paid plans start at $50/month
- Each analysis uses 1 search

## Security Notes

- Never share your API keys publicly
- Keep your `background.js` file secure
- Consider using environment variables for production

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API keys are working
3. Test with a simple tweet first
4. Check the README.md for more details 