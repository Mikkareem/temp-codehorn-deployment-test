import axios from 'axios';
import { Problem, ExecutionResult, Submission } from '../types';

// Client requests are routed locally to the NextJS API endpoints
const apiClient = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class CodeHornApiService {
  /**
   * Fetches all coding problems from the platform.
   */
  static async getProblems(): Promise<Problem[]> {
    try {
      const response = await apiClient.get<Problem[]>('/api/problems');
      return response.data;
    } catch (error) {
      console.error('API Error in getProblems:', error);
      throw error;
    }
  }

  /**
   * Fetches details of a specific problem by slug.
   */
  static async getProblemBySlug(slug: string): Promise<Problem | null> {
    try {
      const response = await apiClient.get<Problem>(`/api/problems/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`API Error in getProblemBySlug(${slug}):`, error);
      return null;
    }
  }

  /**
   * Evaluates or executes custom code on sample/custom testcases.
   */
  static async runCode(
    problemSlug: string,
    language: string,
    code: string,
    customTestcases: string
  ): Promise<ExecutionResult> {
    try {
      const response = await apiClient.post<ExecutionResult>('/api/run', {
        problemSlug,
        language,
        code,
        customTestcases,
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error in runCode:', error);
      return {
        status: 'Runtime Error',
        runtime: 0,
        memory: 0.1,
        errorMessage: error.response?.data?.details || error.message || 'Unknown compiler error occurred.',
        passedCount: 0,
        totalCount: 1,
      };
    }
  }

  /**
   * Submits the full solution to run against all testing scenarios.
   */
  static async submitCode(
    problemSlug: string,
    language: string,
    code: string
  ): Promise<Submission> {
    try {
      const response = await apiClient.post<Submission>('/api/submit', {
        problemSlug,
        language,
        code,
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error in submitCode:', error);
      return {
        id: `sub_${Math.random().toString(36).substring(2, 11)}`,
        problemId: '0',
        problemTitle: 'Error',
        problemSlug: problemSlug,
        language,
        code,
        status: 'Runtime Error',
        timestamp: new Date().toISOString(),
        runtime: 0,
        memory: 0,
        compileError: error.response?.data?.details || error.message || 'An unexpected error occurred.',
      };
    }
  }
}
