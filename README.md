# Fake News Twitter Detection - Web Application

A web-based application for analyzing tweets and social media content for credibility and fact-checking using Google Gemini AI and SerpAPI.

## Features

- **Real-time Analysis**: Analyze tweets and social media content for credibility
- **AI-Powered Fact-Checking**: Uses Google Gemini AI for intelligent analysis
- **Source Verification**: Searches for credible sources using SerpAPI
- **Individual Claim Analysis**: Breaks down content into individual claims for detailed verification
- **Credibility Scoring**: Provides overall and individual credibility scores
- **Modern UI**: Clean, responsive web interface

## Setup Instructions

### 1. Prerequisites

- A modern web browser
- API keys for:
  - Google Gemini API
  - SerpAPI (optional, for source searching)

### 2. Configuration

1. Open `app.js` in a text editor
2. Replace the API keys in the `CONFIG` object:
   ```javascript
   const CONFIG = {
       GEMINI_API_KEY: 'your-gemini-api-key-here',
       SERPAPI_KEY: 'your-serpapi-key-here',
       // ... other config
   };
   ```

### 3. Running the Application

#### Option 1: Simple HTTP Server (Recommended)

1. **Using Python 3:**
   ```bash
   cd /path/to/fakenewstwitterdetection
   python -m http.server 8000
   ```

2. **Using Python 2:**
   ```bash
   cd /path/to/fakenewstwitterdetection
   python -m SimpleHTTPServer 8000
   ```

3. **Using Node.js:**
   ```bash
   cd /path/to/fakenewstwitterdetection
   npx http-server -p 8000
   ```

4. **Using PHP:**
   ```bash
   cd /path/to/fakenewstwitterdetection
   php -S localhost:8000
   ```

#### Option 2: Direct File Opening

Simply open `index.html` in your web browser (note: some features may not work due to CORS restrictions).

### 4. Access the Application

Open your web browser and navigate to:
- `http://localhost:8000` (if using a local server)
- Or open `index.html` directly

## Usage

1. **Enter Content**: Paste the tweet or social media content you want to analyze into the text area
2. **Analyze**: Click the "Analyze Content" button or press Ctrl+Enter
3. **Review Results**: View the analysis results including:
   - Generated headline
   - Overall credibility score
   - Individual claim analysis
   - Sources used for verification
   - Detailed analysis summary

## API Keys Setup

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and paste it in `app.js`

### SerpAPI (Optional)

1. Go to [SerpAPI](https://serpapi.com/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy the key and paste it in `app.js`

## File Structure

```
fakenewstwitterdetection/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # Main JavaScript application
├── background.js      # Original extension code (for reference)
├── config.js          # Configuration file (for reference)
├── popup.html         # Original extension popup (for reference)
├── popup.js           # Original extension popup script (for reference)
├── content.js         # Original extension content script (for reference)
├── manifest.json      # Original extension manifest (for reference)
└── README.md          # This file
```

## Features Comparison

| Feature | Extension Version | Web Version |
|---------|------------------|-------------|
| Tweet Analysis | ✅ | ✅ |
| Fact-Checking | ✅ | ✅ |
| Source Verification | ✅ | ✅ |
| Credibility Scoring | ✅ | ✅ |
| Real-time Analysis | ✅ | ✅ |
| Auto Tweet Detection | ✅ | ❌ |
| Browser Integration | ✅ | ❌ |
| Cross-Origin Requests | ✅ | ✅ |

## Troubleshooting

### CORS Issues
If you encounter CORS (Cross-Origin Resource Sharing) issues:
- Use a local HTTP server instead of opening the file directly
- The application is designed to work with local servers

### API Key Issues
- Ensure your API keys are valid and have the necessary permissions
- Check the browser console for any API-related errors

### Network Issues
- Ensure you have a stable internet connection
- Check if your firewall is blocking the requests

## Development

### Adding New Features
1. Modify `app.js` to add new functionality
2. Update `styles.css` for styling changes
3. Modify `index.html` for UI changes

### Testing
- Use the browser's developer tools to debug
- Check the console for any JavaScript errors
- Test with different types of content

## License

This project is for educational and research purposes. Please ensure you comply with the terms of service of the APIs you use.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Ensure you're using a local HTTP server
4. Check the network tab for failed requests