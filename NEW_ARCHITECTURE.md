# 🔄 New Architecture: Individual Claim Credibility Scoring

## **Overview**

The backend logic has been completely restructured to implement a **claim-based credibility scoring system** where each individual claim gets its own credibility score, and the overall tweet credibility is calculated as an average of all claim scores.

## **🔄 Architecture Changes**

### **Before (Old System)**
```
Tweet → Extract Claims → Fact-Check Claims → Calculate Single Score → Generate Analysis
```

### **After (New System)**
```
Tweet → Extract Claims → Analyze Each Claim Individually → Calculate Overall Average → Generate Analysis
```

## **📊 New Data Flow**

### **Step 1: Claims Extraction**
- Extract multiple factual claims from the tweet
- Each claim is identified as a separate verifiable statement

### **Step 2: Individual Claim Analysis**
For each claim:
- **Fact-Check Verdict**: TRUE/FALSE/UNCLEAR with confidence level
- **Individual Credibility Score**: Calculated based on verdict + confidence + sources
- **Source Attribution**: Which credible sources support this specific claim
- **Reasoning**: Explanation of why this verdict was reached

### **Step 3: Overall Credibility Calculation**
- **Simple Average**: Overall score = (Sum of all claim scores) ÷ (Number of claims)
- **No Complex Weighting**: Each claim contributes equally to the final score

## **🎯 Key Benefits of New Architecture**

### **1. Transparency**
- Each claim has its own credibility score
- Users can see which specific claims are credible vs. misleading
- Clear reasoning for each verdict

### **2. Granular Analysis**
- Individual claim scores provide detailed insights
- Better understanding of tweet credibility breakdown
- Identify specific problematic claims

### **3. Fair Scoring**
- Each claim gets equal weight in final calculation
- Source bonuses apply to specific claims, not globally
- More accurate representation of overall credibility

### **4. Better User Experience**
- Users can see individual claim credibility
- Clear visual indicators for each claim
- Detailed reasoning for transparency

## **🔧 Technical Implementation**

### **New Functions Added**

#### **`analyzeIndividualClaims(claims, sources)`**
- Main orchestrator for individual claim analysis
- Calls fact-checking and credibility calculation for each claim
- Returns array of complete claim analyses

#### **`getFactCheckVerdict(claim, sources)`**
- Gets AI verdict for individual claim
- Returns verdict, confidence, and reasoning
- Handles API errors gracefully

#### **`calculateClaimCredibility(factCheck, sources)`**
- Calculates individual claim credibility score
- Applies source bonuses to specific claims
- Ensures scores stay within 0-100 range

#### **`calculateOverallCredibility(claimAnalyses)`**
- Calculates overall tweet credibility
- Simple average of all individual claim scores
- No complex weighting or bonuses

### **Data Structure Changes**

#### **Old Structure**
```javascript
{
    headline: "string",
    credibilityScore: 75,
    factChecks: [
        {
            claim: "string",
            verdict: "TRUE/FALSE/UNCLEAR",
            confidence: 85,
            reasoning: "string"
        }
    ],
    sources: [...],
    analysis: "string"
}
```

#### **New Structure**
```javascript
{
    headline: "string",
    credibilityScore: 75, // Overall average
    factChecks: [
        {
            claim: "string",
            verdict: "TRUE/FALSE/UNCLEAR",
            confidence: 85,
            reasoning: "string",
            credibilityScore: 92, // Individual claim score
            sourcesUsed: ["reuters.com", "bbc.com"] // Sources for this claim
        }
    ],
    sources: [...],
    analysis: "string"
}
```

## **📈 Scoring Algorithm**

### **Individual Claim Scoring**
```javascript
function calculateClaimCredibility(factCheck, sources) {
    let baseScore = 50; // Neutral starting point
    
    // Base score based on verdict and confidence
    if (factCheck.verdict === 'TRUE') {
        baseScore = 80 + (factCheck.confidence / 100) * 20; // 80-100 range
    } else if (factCheck.verdict === 'FALSE') {
        baseScore = 20 - (factCheck.confidence / 100) * 20; // 0-20 range
    } else {
        baseScore = 40 + (factCheck.confidence / 100) * 20; // 40-60 range
    }
    
    // Source bonus for this specific claim
    let sourceBonus = Math.min(sources.length * 2, 10); // Max 10 points
    
    return Math.max(0, Math.min(100, Math.round(baseScore + sourceBonus)));
}
```

### **Overall Credibility**
```javascript
function calculateOverallCredibility(claimAnalyses) {
    if (claimAnalyses.length === 0) return 50;
    
    const totalCredibility = claimAnalyses.reduce((sum, analysis) => {
        return sum + analysis.credibilityScore;
    }, 0);
    
    return Math.round(totalCredibility / claimAnalyses.length);
}
```

## **🎨 UI Updates**

### **New Display Elements**
- **Individual Claim Cards**: Each claim shows in its own styled container
- **Claim Credibility Scores**: Individual percentage scores for each claim
- **Color-Coded Scores**: Green (70%+), Yellow (40-69%), Red (0-39%)
- **Reasoning Display**: Shows AI reasoning for each verdict
- **Source Attribution**: Lists sources used for each specific claim

### **CSS Classes Added**
- `.claim-header`: Header section for each claim
- `.claim-text`: Styling for claim text
- `.claim-credibility`: Credibility score display
- `.claim-reasoning`: Reasoning explanation styling

## **🧪 Testing the New Architecture**

### **Test Page: `test-new-architecture.html`**
- Demonstrates the new individual claim scoring
- Shows example output structure
- Allows testing with custom tweet text

### **Example Output**
```
Tweet: "Scientists discover coffee extends life by 10 years, published in Nature"

Claim 1: "Scientists discover coffee extends life by 10 years"
- Verdict: UNCLEAR (60% confidence)
- Credibility Score: 52%
- Reasoning: While coffee has health benefits, the specific 10-year claim requires verification

Claim 2: "Study published in Nature"
- Verdict: TRUE (85% confidence)  
- Credibility Score: 97%
- Reasoning: Nature is a credible scientific journal

Overall Credibility: 74.5% (Average of individual claim scores)
```

## **🚀 Migration Benefits**

### **For Users**
- **Better Understanding**: See exactly which claims are credible
- **Transparency**: Clear reasoning for each verdict
- **Actionable Insights**: Know which specific parts to verify

### **For Developers**
- **Cleaner Code**: Modular, single-responsibility functions
- **Better Testing**: Can test individual components separately
- **Easier Debugging**: Clear separation of concerns
- **Scalability**: Easy to add new scoring factors per claim

### **For Accuracy**
- **Fair Scoring**: Each claim contributes equally
- **Source Attribution**: Clear which sources support which claims
- **Reduced Bias**: No complex weighting algorithms
- **Consistent Results**: Same input always produces same output

## **🔮 Future Enhancements**

### **Potential Improvements**
- **Claim Weighting**: Allow users to weight claims by importance
- **Source Quality Scoring**: Different source credibility levels
- **Confidence Thresholds**: Adjustable confidence requirements
- **Claim Categories**: Group claims by type (statistics, quotes, etc.)
- **Historical Analysis**: Track credibility trends over time

### **API Extensions**
- **Batch Processing**: Analyze multiple tweets simultaneously
- **Real-time Updates**: Live credibility scoring as sources change
- **Export Options**: Download detailed claim analyses
- **Integration APIs**: Connect with other fact-checking services

## **📋 Implementation Checklist**

- [x] Refactor `analyzeTweet()` function
- [x] Create `analyzeIndividualClaims()` function
- [x] Implement `getFactCheckVerdict()` function
- [x] Add `calculateClaimCredibility()` function
- [x] Create `calculateOverallCredibility()` function
- [x] Update `generateAnalysis()` function
- [x] Modify popup.js for new data structure
- [x] Add CSS styles for individual claims
- [x] Create test page for new architecture
- [x] Update documentation

## **🎯 Summary**

The new architecture transforms the fake news detector from a **single-score system** to a **comprehensive claim-based analysis system**. Each claim gets individual attention with its own credibility score, source attribution, and reasoning. The overall tweet credibility becomes a transparent average of these individual scores, providing users with much more detailed and actionable information about the content they're evaluating.

This approach is more accurate, transparent, and user-friendly than the previous system, while maintaining the same API interface for backward compatibility.
