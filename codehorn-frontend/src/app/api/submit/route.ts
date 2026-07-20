import { NextResponse } from 'next/server';
import { PROBLEMS } from '../../../data/problems';
import { CodeHornLocalRunner } from '../runner';
import { ExecutionResult, Submission } from '../../../types';

export async function POST(request: Request) {
  try {
    const { problemSlug, language, code } = await request.json();
    const useGateway = process.env.USE_GATEWAY === 'true';
    const gatewayUrl = process.env.GATEWAY_API_URL || 'http://localhost:6000';

    if (useGateway) {
      const response = await fetch(`${gatewayUrl}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problemSlug, language, code }),
      });

      if (!response.ok) {
        throw new Error(`Gateway returned status: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Mock/Fallback locally
    const problem = PROBLEMS.find((p) => p.slug === problemSlug);
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    let runResult: ExecutionResult;
    
    if (language === 'javascript') {
      const allTestInput = problem.testcases.map(t => t.input).join('\n---\n');
      runResult = CodeHornLocalRunner.executeJavaScript(code, allTestInput, problem);
    } else {
      runResult = CodeHornLocalRunner.simulateForeignLanguageSubmission(language, code, problem);
    }

    const randomRuntime = runResult.runtime > 0 ? runResult.runtime : Math.floor(Math.random() * 40) + 20;
    const randomMemory = runResult.memory > 0 ? runResult.memory : parseFloat((Math.random() * 5 + 10).toFixed(2));

    const submission: Submission = {
      id: `sub_${Math.random().toString(36).substring(2, 11)}`,
      problemId: problem.id,
      problemTitle: problem.title,
      problemSlug: problem.slug,
      language,
      code,
      status: runResult.status,
      timestamp: new Date().toISOString(),
      runtime: randomRuntime,
      memory: randomMemory,
      compileError: runResult.errorMessage,
      failedTestCase: runResult.failedTestCase,
    };

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Error submitting code:', error);
    return NextResponse.json(
      { error: 'Failed to submit code', details: error.message },
      { status: 500 }
    );
  }
}
