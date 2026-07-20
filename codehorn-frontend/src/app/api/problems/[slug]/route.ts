import { NextResponse } from 'next/server';
import { fetchProblemBySlugServer } from '../../problems-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const problem = await fetchProblemBySlugServer(slug);
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }
    return NextResponse.json(problem);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch problem', details: error.message },
      { status: 500 }
    );
  }
}
