# 🚀 Dynamic Credibility System

## **Overview**

The Fake News Detector now features a **dynamic, subject-aware credibility system** that automatically determines which sources are most credible based on the content being analyzed. Instead of using a fixed list of sources, the system intelligently selects and scores sources based on the subject matter, geographic scope, and context of each tweet.

## **🎯 Key Features**

### **1. Content-Aware Source Selection**
- **AI-Powered Analysis**: Uses Gemini AI to analyze tweet content and determine subject matter
- **Dynamic Source Selection**: Different credible sources for different subjects
- **Context Awareness**: Considers geographic scope and temporal context
- **Intelligent Scoring**: Sources scored based on relevance and credibility

### **2. Subject-Specific Credibility**
- **Politics**: NYT, Washington Post, WSJ, Politico, The Hill
- **Sports**: ESPN, Sports Illustrated, Bleacher Report, CBS Sports
- **Science**: Nature, Science, Cell, The Lancet, Scientific American
- **Health**: WHO, CDC, NIH, Mayo Clinic, WebMD
- **Business**: WSJ, Bloomberg, Financial Times, Economist, Forbes
- **Technology**: TechCrunch, Wired, Ars Technica, The Verge
- **International**: Reuters, BBC, AP, Al Jazeera, DW

### **3. Multi-Dimensional Scoring**
- **Credibility Score**: Base reliability of the source (0-100)
- **Relevance Score**: How well the source matches the subject (0-100)
- **Overall Score**: Weighted combination of both factors

## **🔄 How It Works**

### **Step 1: Content Analysis**
```javascript
async function analyzeContentSubject(content) {
    // AI analyzes the tweet to determine:
    // - Primary subject (POLITICS, SPORTS, SCIENCE, etc.)
    // - Secondary subjects
    // - Geographic scope (LOCAL, NATIONAL, INTERNATIONAL)
    // - Temporal context (CURRENT_EVENT, HISTORICAL, PREDICTIVE)
    // - Credibility factors
    // - Confidence level
}
```

### **Step 2: Dynamic Source Selection**
```javascript
function getSubjectSpecificCredibleSources(contentAnalysis) {
    // Combines base sources (Reuters, AP, BBC) with
    // subject-specific sources based on content analysis
    // Returns comprehensive source list with metadata
}
```

### **Step 3: Intelligent Scoring & Ranking**
```javascript
function scoreAndRankSources(newsResults, credibleSources, contentAnalysis) {
    // Scores each source based on:
    // - Credibility (70% weight)
    // - Subject relevance (20% weight)
    // - Geographic scope match (10% weight)
    // Returns ranked list of most credible and relevant sources
}
```

## **📊 Scoring Algorithm**

### **Credibility Score (70% weight)**
- **Known Credible Sources**: 75-98 points based on established reputation
- **Unknown Sources**: 40 points base + bonuses for domain patterns
- **Domain Bonuses**: 
  - `.edu` or `.gov`: +20 points
  - Contains "news", "times", "post": +10 points

### **Relevance Score (30% weight)**
- **Subject Match**: +20 points if source specializes in the content subject
- **Geographic Scope**: +15 points if source scope matches content scope
- **Secondary Subjects**: Additional bonuses for multi-subject sources

### **Final Score Calculation**
```javascript
finalScore = (credibilityScore × 0.7) + (relevanceScore × 0.3)
```

## **🎨 Subject Categories**

### **POLITICS**
- **Sources**: NYT, Washington Post, WSJ, Politico, The Hill
- **Focus**: Government, elections, policy, legislation
- **Geographic Scope**: Primarily NATIONAL
- **Credibility Range**: 78-88%

### **SPORTS**
- **Sources**: ESPN, Sports Illustrated, Bleacher Report, CBS Sports
- **Focus**: Professional sports, college athletics, sports business
- **Geographic Scope**: INTERNATIONAL
- **Credibility Range**: 75-85%

### **SCIENCE**
- **Sources**: Nature, Science, Cell, The Lancet, Scientific American
- **Focus**: Research, discoveries, peer-reviewed studies
- **Geographic Scope**: INTERNATIONAL
- **Credibility Range**: 85-98%

### **HEALTH**
- **Sources**: WHO, CDC, NIH, Mayo Clinic, WebMD
- **Focus**: Medical research, public health, clinical studies
- **Geographic Scope**: NATIONAL/INTERNATIONAL
- **Credibility Range**: 78-98%

### **BUSINESS**
- **Sources**: WSJ, Bloomberg, Financial Times, Economist, Forbes
- **Focus**: Markets, economy, corporate news, financial analysis
- **Geographic Scope**: INTERNATIONAL
- **Credibility Range**: 78-90%

### **TECHNOLOGY**
- **Sources**: TechCrunch, Wired, Ars Technica, The Verge, Engadget
- **Focus**: Tech industry, product reviews, innovation
- **Geographic Scope**: INTERNATIONAL
- **Credibility Range**: 75-85%

### **INTERNATIONAL**
- **Sources**: Reuters, BBC, AP, Al Jazeera, DW, France 24
- **Focus**: Global news, international relations, world events
- **Geographic Scope**: INTERNATIONAL
- **Credibility Range**: 80-95%

## **🔧 Technical Implementation**

### **New Functions Added**

#### **`analyzeContentSubject(content)`**
- **Purpose**: AI-powered content analysis
- **Returns**: Structured analysis with subject, scope, and context
- **Fallback**: Keyword-based analysis if AI fails

#### **`getSubjectSpecificCredibleSources(contentAnalysis)`**
- **Purpose**: Dynamic source selection based on content
- **Returns**: Comprehensive source list with metadata
- **Features**: Combines base and subject-specific sources

#### **`scoreAndRankSources(newsResults, credibleSources, contentAnalysis)`**
- **Purpose**: Intelligent scoring and ranking of sources
- **Returns**: Ranked list with credibility and relevance scores
- **Algorithm**: Weighted scoring based on multiple factors

### **Data Structure Changes**

#### **Enhanced Source Objects**
```javascript
{
    title: "Article Title",
    url: "https://source.com/article",
    snippet: "Article summary",
    source: "source.com",
    credibilityScore: 85,      // Base credibility (0-100)
    relevanceScore: 25,        // Subject relevance (0-100)
    finalScore: 78,            // Overall weighted score
    sourceInfo: {              // Metadata from credible sources list
        credibility: 85,
        subjects: ['POLITICS'],
        scope: 'NATIONAL'
    }
}
```

#### **Content Analysis Results**
```javascript
{
    primarySubject: "POLITICS",
    secondarySubjects: ["ECONOMY"],
    geographicScope: "NATIONAL",
    temporalContext: "CURRENT_EVENT",
    credibilityFactors: ["policy_announcement", "government_source"],
    confidence: 85
}
```

## **🧪 Testing the System**

### **Test Page: `test-dynamic-credibility.html`**
- **Subject Detection**: Test how well the AI identifies content subjects
- **Source Selection**: See which credible sources are selected for each subject
- **Scoring System**: Understand how sources are scored and ranked
- **Example Tweets**: Pre-loaded examples for different subjects

### **Example Test Cases**

#### **Politics Tweet**
```
"President announces new economic policy that will create 2 million jobs"
→ Subject: POLITICS
→ Sources: NYT, Washington Post, WSJ, Politico
→ High relevance for political sources
```

#### **Science Tweet**
```
"NASA researchers discover evidence of water on Mars"
→ Subject: SCIENCE
→ Sources: Nature, Science, Scientific American
→ High credibility for scientific sources
```

#### **Sports Tweet**
```
"Lakers star LeBron James scores 40 points in comeback victory"
→ Subject: SPORTS
→ Sources: ESPN, Sports Illustrated, Bleacher Report
→ High relevance for sports sources
```

## **🚀 Benefits of Dynamic System**

### **For Users**
- **More Accurate Analysis**: Sources relevant to the specific content
- **Better Context**: Understanding of why sources were selected
- **Transparent Scoring**: Clear breakdown of credibility and relevance
- **Subject Expertise**: Access to specialized sources for different topics

### **For Accuracy**
- **Context-Aware**: Sources matched to content type
- **Geographic Relevance**: Local sources for local news
- **Temporal Context**: Current vs. historical sources
- **Multi-Subject Support**: Complex content with multiple subjects

### **For Scalability**
- **Easy Expansion**: Add new subjects and sources
- **Flexible Scoring**: Adjustable algorithms and weights
- **AI Integration**: Continuous improvement through AI analysis
- **Fallback Systems**: Robust handling of edge cases

## **🔮 Future Enhancements**

### **Planned Improvements**
- **Real-time Source Updates**: Dynamic credibility adjustments
- **User Preferences**: Customizable source preferences
- **Historical Analysis**: Source credibility trends over time
- **Community Ratings**: User-contributed source assessments

### **Advanced Features**
- **Multi-language Support**: International source credibility
- **Bias Detection**: Source political leaning analysis
- **Fact-checking Integration**: Cross-reference with fact-checking sites
- **Social Media Analysis**: Credibility of social media sources

## **📋 Implementation Checklist**

- [x] Content analysis function with AI integration
- [x] Subject-specific credible sources database
- [x] Dynamic source selection algorithm
- [x] Multi-dimensional scoring system
- [x] Source ranking and filtering
- [x] Enhanced UI for source display
- [x] Test page for system validation
- [x] Fallback systems for error handling
- [x] Comprehensive documentation

## **🎯 Summary**

The Dynamic Credibility System transforms the fake news detector from a **static, one-size-fits-all approach** to an **intelligent, context-aware system** that:

1. **Analyzes Content**: Uses AI to understand what the tweet is about
2. **Selects Sources**: Dynamically chooses the most credible sources for that subject
3. **Scores Intelligently**: Combines credibility and relevance for accurate assessment
4. **Provides Transparency**: Shows users exactly why sources were selected and scored

This system provides much more accurate and relevant fact-checking by ensuring that the sources used for verification are not only credible but also appropriate for the specific type of content being analyzed.
