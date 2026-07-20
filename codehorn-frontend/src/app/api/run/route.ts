import { NextResponse } from 'next/server';
import { PROBLEMS } from '../../../data/problems';
import { CodeHornLocalRunner } from '../runner';

export async function POST(request: Request) {
  try {
    const { problemSlug, language, code, customTestcases } = await request.json();
    const useGateway = process.env.USE_GATEWAY === 'true';
    const gatewayUrl = process.env.GATEWAY_API_URL || 'http://localhost:6000';

    if (useGateway) {
      const response = await fetch(`${gatewayUrl}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problemSlug, language, code, customTestcases }),
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

    let result;
    if (language === 'javascript') {
      result = CodeHornLocalRunner.executeJavaScript(code, customTestcases, problem);
    } else {
      result = CodeHornLocalRunner.simulateForeignLanguageRun(language, code, customTestcases, problem);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running code:', error);
    return NextResponse.json(
      { error: 'Failed to execute run code', details: error.message },
      { status: 500 }
    );
  }
}
