// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// API configuration
const API_BASE = 'https://YOUR-API-HOST'; // Replace with your actual API host

// DOM elements
const authSection = document.getElementById('auth-section');
const userInfo = document.getElementById('user-info');
const factCheckSection = document.getElementById('fact-check-section');
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userEmail = document.getElementById('user-email');
const usagePill = document.getElementById('usage-pill');
const textInput = document.getElementById('text-input');
const factCheckBtn = document.getElementById('fact-check-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const result = document.getElementById('result');
const resultText = document.getElementById('result-text');

// State
let currentUser = null;
let userLimits = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthState();
});

function setupEventListeners() {
  signInBtn.addEventListener('click', handleSignIn);
  signOutBtn.addEventListener('click', handleSignOut);
  factCheckBtn.addEventListener('click', handleFactCheck);
  upgradeBtn.addEventListener('click', handleUpgrade);
}

async function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user) {
      showUserInterface(user);
      await loadUserLimits();
    } else {
      showAuthInterface();
    }
  });
}

async function handleSignIn() {
  try {
    signInBtn.disabled = true;
    signInBtn.textContent = 'Signing in...';
    
    const result = await signInWithPopup(auth, provider);
    console.log('Signed in:', result.user.email);
  } catch (error) {
    console.error('Sign in error:', error);
    alert('Sign in failed. Please try again.');
  } finally {
    signInBtn.disabled = false;
    signInBtn.textContent = 'Sign in with Google';
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
    console.log('Signed out');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

function showAuthInterface() {
  authSection.classList.remove('hidden');
  userInfo.classList.add('hidden');
  factCheckSection.classList.add('hidden');
  result.classList.add('hidden');
}

function showUserInterface(user) {
  authSection.classList.add('hidden');
  userInfo.classList.remove('hidden');
  factCheckSection.classList.remove('hidden');
  
  userEmail.textContent = user.email;
}

async function loadUserLimits() {
  if (!currentUser) return;
  
  try {
    const idToken = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE}/api/me/limits`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load limits');
    }
    
    userLimits = await response.json();
    updateUsageDisplay();
    
  } catch (error) {
    console.error('Error loading limits:', error);
    usagePill.textContent = 'Error loading usage';
  }
}

function updateUsageDisplay() {
  if (!userLimits) return;
  
  if (userLimits.plan === 'pro') {
    usagePill.textContent = 'Pro · Unlimited';
    usagePill.className = 'usage-pill pro';
    upgradeBtn.classList.add('hidden');
  } else {
    const { used, limit, resetsAt } = userLimits;
    const resetTime = new Date(resetsAt).toLocaleTimeString();
    usagePill.textContent = `Free: ${used}/${limit} · resets ${resetTime}`;
    usagePill.className = 'usage-pill';
    
    // Show upgrade button if approaching limit
    if (used >= limit * 0.8) {
      upgradeBtn.classList.remove('hidden');
    }
  }
}

async function handleFactCheck() {
  const text = textInput.value.trim();
  
  if (!text) {
    alert('Please enter text to fact-check');
    return;
  }
  
  if (!currentUser) {
    alert('Please sign in first');
    return;
  }
  
  try {
    factCheckBtn.disabled = true;
    factCheckBtn.textContent = 'Checking...';
    result.classList.add('hidden');
    
    const idToken = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE}/api/fact-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (response.status === 402) {
      // Quota exceeded
      const errorData = await response.json();
      showQuotaExceeded(errorData);
      return;
    }
    
    if (!response.ok) {
      throw new Error('Fact check failed');
    }
    
    const data = await response.json();
    showResult(data.result);
    
    // Reload limits to update usage
    await loadUserLimits();
    
  } catch (error) {
    console.error('Fact check error:', error);
    showError('Fact check failed. Please try again.');
  } finally {
    factCheckBtn.disabled = false;
    factCheckBtn.textContent = 'Fact Check';
  }
}

function showQuotaExceeded(errorData) {
  const { limit, used, resetsAt } = errorData;
  const resetTime = new Date(resetsAt).toLocaleTimeString();
  
  resultText.innerHTML = `
    <strong>Daily limit reached!</strong><br>
    You've used ${used}/${limit} fact checks today.<br>
    Your limit resets at ${resetTime}.<br><br>
    <button class="upgrade-btn" onclick="handleUpgrade()">Upgrade to Pro for unlimited checks</button>
  `;
  result.className = 'result error';
  result.classList.remove('hidden');
  
  upgradeBtn.classList.remove('hidden');
}

function showResult(result) {
  resultText.innerHTML = `
    <strong>Verdict:</strong> ${result.verdict}<br>
    <strong>Text analyzed:</strong> ${result.text}<br>
    <strong>Sources found:</strong> ${result.sources.length}
  `;
  result.className = 'result';
  result.classList.remove('hidden');
}

function showError(message) {
  resultText.textContent = message;
  result.className = 'result error';
  result.classList.remove('hidden');
}

async function handleUpgrade() {
  if (!currentUser) {
    alert('Please sign in first');
    return;
  }
  
  try {
    upgradeBtn.disabled = true;
    upgradeBtn.textContent = 'Creating checkout...';
    
    const idToken = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }
    
    const data = await response.json();
    
    // Open Stripe Checkout in new tab
    chrome.tabs.create({ url: data.url });
    
  } catch (error) {
    console.error('Upgrade error:', error);
    alert('Failed to start upgrade process. Please try again.');
  } finally {
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = 'Upgrade to Pro';
  }
}
