# Fake News Detector for Twitter

A Chrome extension that analyzes Twitter posts for fake news detection using AI and web search integration.

## Features

- 🔍 **AI-Powered Analysis**: Uses OpenAI GPT to analyze tweet content
- 📰 **Headline Generation**: Creates concise headlines summarizing tweet claims
- 🎯 **Credibility Scoring**: Provides percentage-based credibility scores
- 🔍 **Fact-Checking**: Extracts and verifies specific claims against credible sources
- 📊 **Source Verification**: Searches for credible news sources to verify claims
- 🎨 **Visual Overlays**: Displays analysis results directly on Twitter posts
- ⚡ **Auto-Analysis**: Optional automatic analysis of tweets as you browse
- 📱 **Modern UI**: Beautiful, responsive interface with dark mode support

## How It Works

1. **Content Extraction**: Extracts tweet text from Twitter/X pages
2. **AI Analysis**: Uses OpenAI to generate headlines and extract claims
3. **Web Search**: Searches for credible news sources using SerpAPI
4. **Fact-Checking**: Verifies claims against found sources
5. **Scoring**: Calculates credibility score based on fact-check results
6. **Display**: Shows results in popup and as overlays on tweets

## Setup Instructions

### Prerequisites

- Chrome browser
- OpenAI API key
- SerpAPI key (optional, for enhanced source search)

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd fakenewstwitterdetection
   ```

2. **Configure API Keys**
   - Open `background.js`
   - Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key
   - Replace `YOUR_SERPAPI_KEY` with your SerpAPI key (optional)

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

4. **Get API Keys**
   - **OpenAI**: Sign up at [OpenAI](https://platform.openai.com/) and get an API key
   - **SerpAPI**: Sign up at [SerpAPI](https://serpapi.com/) for enhanced web search (optional)

## Usage

### Manual Analysis
1. Navigate to Twitter/X
2. Click the extension icon in your browser toolbar
3. Click "Analyze Current Tweet" to analyze the tweet you're viewing
4. Or paste tweet text and click "Analyze Pasted Text"

### Auto-Analysis
1. Open the extension popup
2. Check "Auto-analyze tweets"
3. Browse Twitter normally - tweets will be analyzed automatically
4. Look for colored overlays on tweets indicating credibility

### Understanding Results

- **Credibility Score**: 0-100% rating of tweet credibility
- **Headline Summary**: AI-generated headline of the main claim
- **Fact Check Results**: Verification of specific claims (TRUE/FALSE/UNCLEAR)
- **Sources**: Links to credible news sources used for verification
- **Analysis**: Detailed explanation of the assessment

### Color Coding
- 🟢 **Green (70%+)**: Likely credible
- 🟡 **Yellow (40-69%)**: Unclear or mixed evidence
- 🔴 **Red (0-39%)**: Likely fake or misleading

## File Structure

```
fakenewstwitterdetection/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── content.js             # Content script for Twitter pages
├── content.css            # Content script styles
├── icons/                 # Extension icons
└── README.md              # This file
```

## API Configuration

### Required: OpenAI API
The extension requires an OpenAI API key for:
- Headline generation
- Claim extraction
- Fact-checking analysis
- Detailed analysis generation

### Optional: SerpAPI
SerpAPI enhances the extension by:
- Searching for credible news sources
- Providing more comprehensive fact-checking
- Improving source verification

## Privacy & Security

- **Local Processing**: Tweet content is processed locally before API calls
- **No Data Storage**: No personal data is stored permanently
- **API Usage**: Only tweet content is sent to APIs for analysis
- **Secure Communication**: All API calls use HTTPS

## Limitations

- **API Costs**: OpenAI and SerpAPI usage incurs costs
- **Rate Limits**: API providers may have rate limits
- **Accuracy**: AI analysis is not 100% accurate
- **Source Availability**: Depends on available credible sources
- **Language**: Currently optimized for English content

## Troubleshooting

### Extension Not Working
1. Check that API keys are correctly configured
2. Ensure you're on Twitter/X pages
3. Check browser console for error messages
4. Verify extension permissions

### API Errors
1. Verify API keys are valid and have sufficient credits
2. Check API rate limits
3. Ensure internet connection is stable

### No Analysis Results
1. Make sure you're viewing a tweet with text content
2. Try refreshing the page
3. Check if the tweet contains verifiable claims

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension is for educational and informational purposes only. AI-generated analysis should not be considered as definitive fact-checking. Always verify information from multiple credible sources and use critical thinking when evaluating online content.

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review API documentation for OpenAI and SerpAPI 