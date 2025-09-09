#!/usr/bin/env node

/**
 * Simple build script for the Fake News Detector Chrome Extension
 * This script reads environment variables and creates a config file for the extension
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  No .env file found. Using default values.');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// Create config file with environment variables
function createConfigFile() {
  const envVars = loadEnvFile();
  
  const configContent = `// Auto-generated config file - DO NOT EDIT MANUALLY
// This file is created by build.js from environment variables

const config = {
    gemini: {
        apiKey: '${envVars.GEMINI_API_KEY || 'your_gemini_api_key_here'}',
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
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else if (typeof window !== 'undefined') {
    window.fakeNewsConfig = config;
}`;

  fs.writeFileSync(path.join(__dirname, 'config.generated.js'), configContent);
  console.log('✅ Generated config.generated.js from environment variables');
}

// Main build function
function build() {
  console.log('🔨 Building Fake News Detector Extension...');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from .env.example...');
    const examplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('✅ Created .env file. Please edit it with your API keys.');
    } else {
      console.log('❌ No .env.example file found. Please create a .env file manually.');
    }
  }
  
  // Create config file
  createConfigFile();
  
  console.log('🎉 Build complete!');
  console.log('📋 Next steps:');
  console.log('   1. Edit .env file with your API keys');
  console.log('   2. Load the extension in Chrome');
  console.log('   3. Test the functionality');
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build, loadEnvFile, createConfigFile };
