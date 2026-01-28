import axios from 'axios';
import { config } from '../../config/env.js';

export class CoreNLPService {
  private endpoint: string;
  private isConfigured: boolean = false;

  constructor() {
    this.endpoint = config.ai.stanfordNLP.endpoint;
    this.isConfigured = !!config.ai.stanfordNLP.apiKey;

    if (this.isConfigured) {
      console.log('✅ Stanford CoreNLP service initialized');
    } else if (!config.mock.voiceAIEnabled) {
      console.warn('⚠️  Stanford CoreNLP not configured - using simplified analysis');
    }
  }

  /**
   * Separate text into sentences using CoreNLP
   */
  async separateSentences(text: string): Promise<string[]> {
    if (config.mock.voiceAIEnabled || !this.isConfigured) {
      return this.mockSentenceSeparation(text);
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/?properties={"annotators":"ssplit","outputFormat":"json"}`,
        text,
        {
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${config.ai.stanfordNLP.apiKey}`,
          },
          timeout: 5000,
        }
      );

      const sentences = response.data.sentences?.map((s: any) => 
        s.tokens?.map((t: any) => t.word).join(' ')
      ) || [];

      return sentences;
    } catch (error) {
      console.warn('CoreNLP sentence separation failed, using fallback');
      return this.mockSentenceSeparation(text);
    }
  }

  /**
   * Perform Part-of-Speech tagging
   */
  async posTagging(text: string): Promise<Array<{ word: string; pos: string }>> {
    if (config.mock.voiceAIEnabled || !this.isConfigured) {
      return this.mockPOSTagging(text);
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/?properties={"annotators":"tokenize,ssplit,pos","outputFormat":"json"}`,
        text,
        {
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${config.ai.stanfordNLP.apiKey}`,
          },
          timeout: 5000,
        }
      );

      const tokens = response.data.sentences?.[0]?.tokens?.map((t: any) => ({
        word: t.word,
        pos: t.pos,
      })) || [];

      return tokens;
    } catch (error) {
      console.warn('CoreNLP POS tagging failed, using fallback');
      return this.mockPOSTagging(text);
    }
  }

  /**
   * Named Entity Recognition
   */
  async extractEntities(text: string): Promise<Array<{ text: string; type: string }>> {
    if (config.mock.voiceAIEnabled || !this.isConfigured) {
      return [];
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/?properties={"annotators":"tokenize,ssplit,pos,lemma,ner","outputFormat":"json"}`,
        text,
        {
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${config.ai.stanfordNLP.apiKey}`,
          },
          timeout: 5000,
        }
      );

      const entities = response.data.sentences?.[0]?.tokens
        ?.filter((t: any) => t.ner !== 'O')
        .map((t: any) => ({
          text: t.word,
          type: t.ner,
        })) || [];

      return entities;
    } catch (error) {
      return [];
    }
  }

  /**
   * Mock sentence separation (simple fallback)
   */
  private mockSentenceSeparation(text: string): string[] {
    // Simple sentence splitting on common punctuation
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Mock POS tagging (simplified)
   */
  private mockPOSTagging(text: string): Array<{ word: string; pos: string }> {
    return text.split(/\s+/).map(word => ({
      word,
      pos: 'NN', // Default to noun
    }));
  }
}

export default new CoreNLPService();
