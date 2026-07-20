export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ProblemStatus = 'Todo' | 'Attempted' | 'Solved';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

export interface ProblemExample {
  id: number;
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  acceptanceRate: number;
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  hints: string[];
  editorial: string;
  solutionApproaches: string[];
  starterCode: {
    javascript: string;
    python: string;
    cpp: string;
    java: string;
  };
  testcases: TestCase[];
}

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  language: string;
  code: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded';
  timestamp: string;
  runtime: number; // in milliseconds
  memory: number; // in MB
  compileError?: string;
  failedTestCase?: {
    input: string;
    expected: string;
    actual: string;
    stdout?: string;
  };
}

export interface ExecutionResult {
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded';
  runtime: number;
  memory: number;
  stdout?: string;
  errorMessage?: string;
  passedCount: number;
  totalCount: number;
  failedTestCase?: {
    input: string;
    expected: string;
    actual: string;
    stdout?: string;
  };
}
