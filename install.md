# Installation Guide for Fake News Detector

## Quick Setup

### Step 1: Get API Keys

1. **Google Gemini API Key** (Required)
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key

2. **SerpAPI Key** (Optional but recommended)
   - Go to [SerpAPI](https://serpapi.com/)
   - Sign up for a free account
   - Get your API key from the dashboard
   - Copy the key

### Step 2: Configure the Extension

1. **Edit the configuration file**
   - Open `background.js` in a text editor
   - Find this line:
     ```javascript
     const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
     ```
   - Replace with your actual API key:
     ```javascript
     const GEMINI_API_KEY = 'your-actual-gemini-api-key-here';
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
- Ensure you have a valid Gemini API key
- Check your internet connection

### No Analysis Results
- Make sure you're on a Twitter/X page
- Verify the tweet contains text content
- Check browser console for error messages

## API Usage Costs

### Google Gemini Costs
- **Free tier**: 15 requests per minute, 1500 requests per day
- **Paid tier**: $0.0005 per 1K characters input, $0.0015 per 1K characters output
- Typical analysis: 500-1000 characters
- Cost per analysis: Free (within limits) or ~$0.0005-0.001

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