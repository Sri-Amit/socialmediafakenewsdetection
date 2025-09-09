# 🚀 Quick Setup Guide

## Prerequisites
- Google Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/))
- Chrome browser
- Basic knowledge of Chrome extensions

## Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd fakenewstwitterdetection
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual API keys
nano .env  # or use your preferred editor
```

### 3. Add Your API Keys
Edit the `.env` file and replace the placeholder values:

```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Load the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the extension folder
5. The extension should now appear in your extensions list

### 5. Test the Extension
1. Visit Twitter/X, Instagram, or Facebook
2. Look for the "🔍 Fact Check" button on posts
3. Click the button to test the fact-checking functionality

## 🔑 Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key to your `.env` file


## 🛠️ Development

### Testing
- Use `test-grounding.html` to test the grounding functionality
- Check the browser console for any errors
- Verify API keys are working correctly

### Building
The extension is ready to use as-is. No build process required for basic functionality.

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and don't share them
- The `.env.example` file shows the required format without exposing real keys
- API keys are loaded at runtime and not hardcoded in the extension

## 📝 Troubleshooting

### Extension Not Working
- Check that your API keys are correct in the `.env` file
- Verify the extension is loaded in Chrome
- Check the browser console for error messages

### API Errors
- Ensure your Gemini API key has grounding enabled
- Check your API quota and billing
- Verify the API key has the necessary permissions

### Grounding Not Working
- Make sure you're using Gemini 2.5 Flash model
- Check that grounding is enabled in your API key settings
- Test with the provided `test-grounding.html` file

## 🎯 Features

- ✅ Multi-platform support (Twitter/X, Instagram, Facebook)
- ✅ AI-powered fact-checking with Google Gemini 2.5 Flash
- ✅ Real-time grounding with Google Search
- ✅ Image text extraction
- ✅ Credibility scoring
- ✅ Source verification
- ✅ Modern, responsive UI

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Test your API keys with the provided test files
4. Ensure all dependencies are properly configured
