import { AssemblyAI } from 'assemblyai';
import { config } from '../../config/env.js';

export class AssemblyAIService {
  private client: AssemblyAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (config.ai.assemblyAI.apiKey) {
      this.client = new AssemblyAI({
        apiKey: config.ai.assemblyAI.apiKey,
      });
      this.isConfigured = true;
      console.log('✅ AssemblyAI service initialized');
    } else if (!config.mock.voiceAIEnabled) {
      console.warn('⚠️  AssemblyAI API key not configured');
    }
  }

  /**
   * Convert audio buffer to text using AssemblyAI
   */
  async transcribeAudio(audioBuffer: Buffer | string): Promise<{
    text: string;
    confidence: number;
    words: Array<{ text: string; confidence: number; start: number; end: number }>;
  }> {
    // Mock mode for development
    if (config.mock.voiceAIEnabled || !this.isConfigured) {
      return this.mockTranscription(audioBuffer);
    }

    try {
      // Upload audio file or use URL
      const transcript = await this.client!.transcripts.transcribe({
        audio: audioBuffer,
        language_code: 'hi', // Hindi + English
        speech_model: 'best',
        punctuate: true,
        format_text: true,
        dual_channel: false,
      });

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      return {
        text: transcript.text || '',
        confidence: transcript.confidence || 0,
        words: transcript.words?.map(w => ({
          text: w.text,
          confidence: w.confidence,
          start: w.start,
          end: w.end,
        })) || [],
      };
    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
      throw new Error('Speech-to-text conversion failed');
    }
  }

  /**
   * Real-time streaming transcription
   */
  async streamTranscription(audioStream: any, onTranscript: (text: string) => void) {
    if (config.mock.voiceAIEnabled || !this.isConfigured) {
      return;
    }

    try {
      const rt = this.client!.realtime.createService({ sampleRate: 16000 });

      rt.on('transcript', (transcript) => {
        if (transcript.text) {
          onTranscript(transcript.text);
        }
      });

      rt.on('error', (error) => {
        console.error('Streaming transcription error:', error);
      });

      // Connect to streaming service
      await rt.connect();

      audioStream.on('data', (chunk: Buffer) => {
        const audioData = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
        rt.sendAudio(audioData);
      });

      audioStream.on('end', () => {
        rt.close();
      });
    } catch (error) {
      console.error('Streaming setup error:', error);
      throw error;
    }
  }

  /**
   * Mock transcription for development/testing
   */
  private mockTranscription(audioBuffer: Buffer | string): any {
    const mockPhrases = [
      'bachao mujhe madad chahiye',
      'help me please',
      'someone is following me',
      'I need help urgently',
      'please call police',
    ];

    const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];

    return {
      text: randomPhrase,
      confidence: 0.92,
      words: randomPhrase.split(' ').map((word, i) => ({
        text: word,
        confidence: 0.9 + Math.random() * 0.1,
        start: i * 500,
        end: (i + 1) * 500,
      })),
    };
  }
}

export default new AssemblyAIService();
