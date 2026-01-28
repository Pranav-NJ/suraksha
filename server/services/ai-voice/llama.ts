import axios from 'axios';
import { config } from '../../config/env.js';

interface LlamaResponse {
  distressLevel: number;
  isEmergency: boolean;
  reasoning: string;
  keywords: string[];
  emotionalState: string;
}

export class LlamaService {
  private endpoint: string;
  private modelPath: string | undefined;
  private isConfigured: boolean = false;

  constructor() {
    this.endpoint = config.ai.llama.endpoint;
    this.modelPath = config.ai.llama.modelPath;
    this.isConfigured = !!(this.modelPath || this.endpoint);

    if (this.isConfigured) {
      console.log('✅ Llama 2 service initialized');
    } else if (!config.mock.voiceAIEnabled) {
      console.warn('⚠️  Llama 2 not configured - using rule-based detection');
    }
  }

  /**
   * Analyze text for distress using Llama 2
   */
  async analyzeDistress(text: string, sentences: string[]): Promise<LlamaResponse> {
    if (config.mock.voiceAIEnabled || !this.isConfigured) {
      return this.mockAnalysis(text);
    }

    try {
      const prompt = this.buildDistressPrompt(text, sentences);

      const response = await axios.post(
        `${this.endpoint}/completion`,
        {
          prompt,
          temperature: 0.3,
          max_tokens: 150,
          stop: ['</analysis>'],
        },
        {
          timeout: config.ai.voiceAI.processingTimeout,
        }
      );

      return this.parseResponse(response.data.content || response.data.text);
    } catch (error) {
      console.warn('Llama 2 analysis failed, using rule-based fallback');
      return this.ruleBasedAnalysis(text);
    }
  }

  /**
   * Build distress analysis prompt
   */
  private buildDistressPrompt(text: string, sentences: string[]): string {
    return `You are an AI safety assistant analyzing speech for distress signals. 
Analyze the following text for signs of emergency or distress:

Text: "${text}"
Sentences: ${sentences.join(' | ')}

Consider:
1. Distress keywords (bachao, madad, help, emergency, police)
2. Emotional tone (fear, panic, urgency)
3. Context and situation indicators
4. Cultural context (Hindi/English phrases)

Respond in JSON format:
{
  "distressLevel": 0.0-1.0,
  "isEmergency": true/false,
  "reasoning": "brief explanation",
  "keywords": ["detected", "keywords"],
  "emotionalState": "calm/concerned/distressed/panic"
}

<analysis>`;
  }

  /**
   * Parse Llama response
   */
  private parseResponse(text: string): LlamaResponse {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          distressLevel: parsed.distressLevel || 0,
          isEmergency: parsed.isEmergency || false,
          reasoning: parsed.reasoning || '',
          keywords: parsed.keywords || [],
          emotionalState: parsed.emotionalState || 'unknown',
        };
      }
    } catch (error) {
      console.error('Failed to parse Llama response:', error);
    }

    // Fallback to rule-based
    return this.ruleBasedAnalysis(text);
  }

  /**
   * Rule-based distress analysis (fallback)
   */
  private ruleBasedAnalysis(text: string): LlamaResponse {
    const lowerText = text.toLowerCase();

    // Distress keywords with weights
    const distressKeywords = {
      // High priority (Hindi & English)
      'bachao': 0.95,
      'madad': 0.95,
      'help': 0.90,
      'emergency': 0.90,
      'police': 0.85,
      'danger': 0.85,
      'scared': 0.80,
      'following': 0.75,
      'attack': 0.90,
      'threatened': 0.85,
      'harass': 0.80,
      'unsafe': 0.75,
      'kidnap': 0.95,
      'assault': 0.90,
    };

    let distressScore = 0;
    const detectedKeywords: string[] = [];

    // Check for distress keywords
    for (const [keyword, weight] of Object.entries(distressKeywords)) {
      if (lowerText.includes(keyword)) {
        distressScore = Math.max(distressScore, weight);
        detectedKeywords.push(keyword);
      }
    }

    // Boost score for multiple keywords
    if (detectedKeywords.length > 1) {
      distressScore = Math.min(1.0, distressScore + 0.1 * (detectedKeywords.length - 1));
    }

    // Determine emotional state
    let emotionalState = 'calm';
    if (distressScore > 0.85) emotionalState = 'panic';
    else if (distressScore > 0.70) emotionalState = 'distressed';
    else if (distressScore > 0.50) emotionalState = 'concerned';

    return {
      distressLevel: distressScore,
      isEmergency: distressScore >= config.ai.voiceAI.confidenceThreshold,
      reasoning: detectedKeywords.length > 0
        ? `Detected distress keywords: ${detectedKeywords.join(', ')}`
        : 'No distress indicators found',
      keywords: detectedKeywords,
      emotionalState,
    };
  }

  /**
   * Mock analysis for development
   */
  private mockAnalysis(text: string): LlamaResponse {
    // Simple mock that randomly triggers on certain keywords
    const hasDistress = /bachao|madad|help|emergency|police/i.test(text);

    return {
      distressLevel: hasDistress ? 0.92 : 0.15,
      isEmergency: hasDistress,
      reasoning: hasDistress ? 'Mock: Distress keywords detected' : 'Mock: Normal speech',
      keywords: hasDistress ? ['help', 'emergency'] : [],
      emotionalState: hasDistress ? 'distressed' : 'calm',
    };
  }
}

export default new LlamaService();
