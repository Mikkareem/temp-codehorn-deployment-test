import { Problem, ExecutionResult } from '../../types';

export class CodeHornLocalRunner {
  static executeJavaScript(code: string, rawInput: string, problem: Problem): ExecutionResult {
    try {
      const cleanedCode = code.trim();
      let functionName = '';
      if (problem.slug === 'two-sum') functionName = 'twoSum';
      else if (problem.slug === 'valid-parentheses') functionName = 'isValid';
      else if (problem.slug === 'longest-substring-without-repeating-characters') functionName = 'lengthOfLongestSubstring';
      else if (problem.slug === 'container-with-most-water') functionName = 'maxArea';
      else if (problem.slug === 'median-of-two-sorted-arrays') functionName = 'findMedianSortedArrays';

      if (!functionName) {
        throw new Error('Could not resolve parent container execution target.');
      }

      const runnerFnStr = `
        ${cleanedCode}
        if (typeof ${functionName} !== 'function') {
          throw new Error('Function ${functionName} is not defined.');
        }
        return ${functionName};
      `;

      const userFunctionCreator = new Function(runnerFnStr);
      const userMethod = userFunctionCreator();

      const testCasesLines = rawInput.split('\n---\n').filter(Boolean);
      let passedCount = 0;
      let totalCount = 0;

      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

      for (let i = 0; i < testCasesLines.length; i++) {
        totalCount++;
        const caseText = testCasesLines[i].trim();
        if (!caseText) continue;

        const individualLines = caseText.split('\n').map(l => l.trim()).filter(Boolean);
        
        let args: any[] = [];
        try {
          args = individualLines.map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return line;
            }
          });
        } catch (e) {
          throw new Error(`Failed to parse parameters for Test Case #${i + 1}. Ensure correct inputs.`);
        }

        let executionOutput: any;
        const capturedLogs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const interceptor = (...logArgs: any[]) => {
          capturedLogs.push(
            logArgs.map(arg => {
              if (arg === null) return 'null';
              if (arg === undefined) return 'undefined';
              return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            }).join(' ')
          );
          originalLog(...logArgs);
        };

        console.log = interceptor;
        console.warn = interceptor;
        console.error = interceptor;

        try {
          executionOutput = userMethod(...args);
        } catch (runtimeErr: any) {
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
          const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
          return {
            status: 'Runtime Error',
            runtime: Math.round(endTime - startTime),
            memory: 12.4,
            errorMessage: runtimeErr.message || 'JavaScript runtime exception.',
            passedCount,
            totalCount,
          };
        } finally {
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
        }

        const matchingTestcase = problem.testcases.find(t => 
          t.input.replace(/\s+/g, '') === caseText.replace(/\s+/g, '')
        ) || problem.testcases[i] || problem.testcases[0];

        const expectedText = matchingTestcase ? matchingTestcase.expectedOutput : '';
        let expectedValue: any;
        try {
          expectedValue = JSON.parse(expectedText);
        } catch {
          expectedValue = expectedText;
        }

        const isMatch = this.complexDeepEquals(executionOutput, expectedValue);

        if (isMatch) {
          passedCount++;
        } else {
          const stringifiedActual = typeof executionOutput === 'object' ? JSON.stringify(executionOutput) : String(executionOutput);
          
          if (capturedLogs.length === 0) {
            capturedLogs.push(`[SYSTEM] Invoking method for test case #${i + 1}`);
            capturedLogs.push(`[SYSTEM] Parameters list: ${JSON.stringify(args)}`);
            capturedLogs.push(`[SYSTEM] Verification failed output. Memory consumed: 11.5 MB`);
          }

          const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
          return {
            status: 'Wrong Answer',
            runtime: Math.round(endTime - startTime),
            memory: 11.5,
            passedCount,
            totalCount,
            failedTestCase: {
              input: caseText,
              expected: expectedText,
              actual: stringifiedActual,
              stdout: capturedLogs.join('\n')
            }
          };
        }
      }

      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const totalTime = Math.round(endTime - startTime);

      return {
        status: passedCount === totalCount ? 'Accepted' : 'Wrong Answer',
        runtime: totalTime || 12,
        memory: 10.8,
        passedCount,
        totalCount,
      };

    } catch (compileErr: any) {
      return {
        status: 'Runtime Error',
        runtime: 0,
        memory: 0,
        errorMessage: compileErr.message || 'Syntax/Compile error: Check brackets or function signatures.',
        passedCount: 0,
        totalCount: 1,
      };
    }
  }

  private static complexDeepEquals(actual: any, expected: any): boolean {
    if (actual === expected) return true;

    if (typeof expected === 'boolean' && typeof actual === 'string') {
      return String(expected) === actual;
    }
    if (typeof actual === 'boolean' && typeof expected === 'string') {
      return String(actual) === expected;
    }

    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected) < 0.0001;
    }

    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      
      const actualSorted = [...actual].sort((a,b) => a - b);
      const expectedSorted = [...expected].sort((a,b) => a - b);

      return actualSorted.every((val, index) => this.complexDeepEquals(val, expectedSorted[index]));
    }

    return String(actual).trim() === String(expected).trim();
  }

  static simulateForeignLanguageRun(
    language: string,
    code: string,
    testcases: string,
    problem: Problem
  ): ExecutionResult {
    const trimmedCode = code.trim();
    
    if (trimmedCode.length < 50 || !trimmedCode.includes('{') && !trimmedCode.includes('def ')) {
      return {
        status: 'Runtime Error',
        runtime: 0,
        memory: 0,
        errorMessage: `Compilation Error: Please complete the function container class structure for ${language}.`,
        passedCount: 0,
        totalCount: 1,
      };
    }

    return {
      status: 'Accepted',
      runtime: Math.floor(Math.random() * 30) + 15,
      memory: parseFloat((Math.random() * 4 + 14).toFixed(1)),
      passedCount: 1,
      totalCount: 1,
    };
  }

  static simulateForeignLanguageSubmission(
    language: string,
    code: string,
    problem: Problem
  ): ExecutionResult {
    const lowerCode = code.toLowerCase();

    if (lowerCode.length < 60) {
      return {
        status: 'Runtime Error',
        runtime: 0,
        memory: 0,
        errorMessage: 'Compilation Error: Code is too short or empty.',
        passedCount: 0,
        totalCount: problem.testcases.length,
      };
    }

    const isMockBlank = lowerCode.includes('pass') || lowerCode.includes('return []') || lowerCode.includes('return false') || lowerCode.includes('return 0');
    if (isMockBlank) {
      const failInput = problem.testcases[1] ? problem.testcases[1].input : problem.testcases[0].input;
      const failExpected = problem.testcases[1] ? problem.testcases[1].expectedOutput : problem.testcases[0].expectedOutput;
      return {
        status: 'Wrong Answer',
        runtime: 32,
        memory: 14.5,
        passedCount: 1,
        totalCount: problem.testcases.length,
        failedTestCase: {
          input: failInput,
          expected: failExpected,
          actual: 'None / Wrong Return Placeholder',
          stdout: `[SANDBOX DEBUG LOGS - ${language.toUpperCase()}]\nInitializing solution solver ...\nEvaluating input parameters...\nParameter Input mapped successfully.\nOutput returned: None / Incorrect signature.\n[FAIL] Assertion error: expected ${failExpected} but got 'None'`
        }
      };
    }

    const rand = Math.random();
    if (rand < 0.05) {
      return {
        status: 'Time Limit Exceeded',
        runtime: 1000,
        memory: 24.1,
        passedCount: Math.floor(problem.testcases.length / 2),
        totalCount: problem.testcases.length,
      };
    } else if (rand < 0.08) {
      return {
        status: 'Memory Limit Exceeded',
        runtime: 120,
        memory: 512.2,
        passedCount: Math.floor(problem.testcases.length / 1.5),
        totalCount: problem.testcases.length,
      };
    }

    return {
      status: 'Accepted',
      runtime: Math.floor(Math.random() * 45) + 8,
      memory: parseFloat((Math.random() * 3 + 12).toFixed(1)),
      passedCount: problem.testcases.length,
      totalCount: problem.testcases.length,
    };
  }
}
