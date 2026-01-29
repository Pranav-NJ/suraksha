import assemblyService from './assembly.js';
import corenlpService from './corenlp.js';
import llamaService from './llama.js';
import { config } from '../../config/env.js';
import db from '../../config/db.js';
import { voicePatterns } from '../../db/schema';

export interface VoiceDetectionResult {
  isEmergency: boolean;
  confidence: number;
  transcription: string;
  distressLevel: number;
  keywords: string[];
  reasoning: string;
  emotionalState: string;
  sentences: string[];
  processingTime: number;
}

export class VoiceDistressDetector {
  /**
   * Main pipeline: Process audio and detect distress
   */
  async processAudio(audioBuffer: Buffer | string): Promise<VoiceDetectionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Speech-to-Text (AssemblyAI)
      console.log('🎤 Step 1: Converting speech to text...');
      const transcriptionResult = await assemblyService.transcribeAudio(audioBuffer);

      if (!transcriptionResult.text || transcriptionResult.text.length === 0) {
        return this.negativeResult('No speech detected', Date.now() - startTime);
      }

      // Step 2: Sentence Separation (Stanford CoreNLP)
      console.log('📝 Step 2: Separating sentences...');
      const sentences = await corenlpService.separateSentences(transcriptionResult.text);

      // Step 3: Distress Analysis (Llama 2)
      console.log('🧠 Step 3: Analyzing for distress...');
      const analysis = await llamaService.analyzeDistress(
        transcriptionResult.text,
        sentences
      );

      const result: VoiceDetectionResult = {
        isEmergency: analysis.isEmergency,
        confidence: analysis.distressLevel,
        transcription: transcriptionResult.text,
        distressLevel: analysis.distressLevel,
        keywords: analysis.keywords,
        reasoning: analysis.reasoning,
        emotionalState: analysis.emotionalState,
        sentences,
        processingTime: Date.now() - startTime,
      };

      console.log('✅ Voice analysis complete:', {
        isEmergency: result.isEmergency,
        confidence: result.confidence,
        keywords: result.keywords,
        processingTime: result.processingTime + 'ms',
      });

      return result;
    } catch (error) {
      console.error('❌ Voice processing error:', error);
      throw new Error('Voice distress detection failed');
    }
  }

  /**
   * Process real-time audio stream
   */
  async processStream(
    audioStream: any,
    onDetection: (result: VoiceDetectionResult) => void
  ): Promise<void> {
    let audioChunks: Buffer[] = [];
    let lastProcessTime = Date.now();

    audioStream.on('data', async (chunk: Buffer) => {
      audioChunks.push(chunk);

      // Process every 3 seconds
      if (Date.now() - lastProcessTime > 3000 && audioChunks.length > 0) {
        lastProcessTime = Date.now();
        const combinedBuffer = Buffer.concat(audioChunks);
        audioChunks = [];

        try {
          const result = await this.processAudio(combinedBuffer);
          onDetection(result);
        } catch (error) {
          console.error('Stream processing error:', error);
        }
      }
    });
  }

  /**
   * Save voice pattern for training
   */
  async saveVoicePattern(
    userId: string,
    audioFingerprint: string,
    result: VoiceDetectionResult
  ): Promise<void> {
    try {
      await db.insert(voicePatterns).values({
        userId,
        audioFingerprint,
        phrasePattern: result.transcription,
        stressIndicators: {
          keywords: result.keywords,
          emotionalState: result.emotionalState,
          distressLevel: result.distressLevel,
        },
        language: this.detectLanguage(result.transcription),
        confidenceScore: result.confidence,
        isValidated: result.isEmergency,
      });
    } catch (error) {
      console.error('Failed to save voice pattern:', error);
    }
  }

  /**
   * Detect language from text (simplified)
   */
  private detectLanguage(text: string): string {
    // Simple heuristic: check for Hindi keywords
    const hindiKeywords = /bachao|madad|बचाओ|मदद/;
    return hindiKeywords.test(text) ? 'hindi' : 'english';
  }

  /**
   * Negative result (no distress detected)
   */
  private negativeResult(reason: string, processingTime: number): VoiceDetectionResult {
    return {
      isEmergency: false,
      confidence: 0,
      transcription: '',
      distressLevel: 0,
      keywords: [],
      reasoning: reason,
      emotionalState: 'calm',
      sentences: [],
      processingTime,
    };
  }

  /**
   * Quick keyword-based pre-check (fast path)
   */
  quickCheck(text: string): boolean {
    const urgentKeywords = /bachao|madad|help|emergency|police|danger/i;
    return urgentKeywords.test(text);
  }
}

export default new VoiceDistressDetector();
