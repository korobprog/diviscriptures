/**
 * Integration with Python parser for vedabase.io
 */

import { spawn } from 'child_process';
import path from 'path';

export interface PythonParserOptions {
  saveToDb?: boolean;
  maxChapters?: number;
  clearExisting?: boolean;
}

export interface PythonParseResult {
  success: boolean;
  text_type: string;
  total_verses: number;
  successful_verses: number;
  failed_verses: number;
  errors: string[];
  duration: number;
  verses_count: number;
  sample_verses: Array<{
    chapter: number;
    verse_number: number;
    sanskrit: string;
    translation: string;
    source: string;
  }>;
}

export interface PythonApiResponse {
  success: boolean;
  error: string | null;
  data: PythonParseResult | null;
}

export interface DatabaseStats {
  total_verses: number;
  by_text_type: {
    bg: number;
    sb: number;
    cc: number;
  };
  recent_parse_records: Array<{
    text_type: string;
    total_verses: number;
    total_errors: number;
    success: boolean;
    created_at: string | null;
  }>;
}

export class PythonParserIntegration {
  private pythonPath: string;
  private parserPath: string;

  constructor() {
    this.pythonPath = 'python3'; // or 'python' on Windows
    this.parserPath = path.join(process.cwd(), 'python-parser');
  }

  /**
   * Run Python parser for a specific text type
   */
  async parseTextType(
    textType: 'bg' | 'sb' | 'cc',
    options: PythonParserOptions = {}
  ): Promise<PythonApiResponse> {
    const args = [
      'integration_api.py',
      'parse',
      textType,
      JSON.stringify({
        save_to_db: options.saveToDb ?? true,
        max_chapters: options.maxChapters ?? null,
      }),
    ];

    return this.runPythonScript(args);
  }

  /**
   * Get database statistics from Python parser
   */
  async getDatabaseStats(): Promise<{ success: boolean; error: string | null; data: DatabaseStats | null }> {
    const args = ['integration_api.py', 'stats'];
    return this.runPythonScript(args);
  }

  /**
   * Run a Python script and return parsed JSON response
   */
  private async runPythonScript(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, args, {
        cwd: this.parserPath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Extract JSON from stdout (look for the last JSON object)
          const lines = stdout.split('\n');
          let jsonLine = '';
          
          // Find the last line that looks like JSON
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              jsonLine = line;
              break;
            }
          }
          
          if (!jsonLine) {
            throw new Error('No JSON found in output');
          }
          
          const result = JSON.parse(jsonLine);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python script output: ${stdout}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  /**
   * Check if Python parser is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const result = await this.getDatabaseStats();
      return result.success;
    } catch (error) {
      console.error('Python parser not available:', error);
      return false;
    }
  }

  /**
   * Get parser status and capabilities
   */
  async getParserStatus(): Promise<{
    available: boolean;
    version?: string;
    capabilities: string[];
    error?: string;
  }> {
    try {
      const available = await this.checkAvailability();
      
      if (!available) {
        return {
          available: false,
          capabilities: [],
          error: 'Python parser not available',
        };
      }

      return {
        available: true,
        capabilities: [
          'parse_bg', // Bhagavad Gita
          'parse_sb', // Srimad Bhagavatam
          'parse_cc', // Chaitanya Charitamrita
          'database_stats',
          'async_parsing',
          'unicode_support',
        ],
      };
    } catch (error) {
      return {
        available: false,
        capabilities: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const pythonParser = new PythonParserIntegration();

// Export utility functions
export async function parseWithPython(
  textType: 'bg' | 'sb' | 'cc',
  options: PythonParserOptions = {}
): Promise<PythonApiResponse> {
  return pythonParser.parseTextType(textType, options);
}

export async function getPythonParserStats(): Promise<DatabaseStats | null> {
  const result = await pythonParser.getDatabaseStats();
  return result.success ? result.data : null;
}

export async function isPythonParserAvailable(): Promise<boolean> {
  return pythonParser.checkAvailability();
}
