import { NextResponse } from 'next/server';
import { fetchProblemsServer } from '../problems-helper';

export async function GET() {
  try {
    const data = await fetchProblemsServer();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch problems', details: error.message },
      { status: 500 }
    );
  }
}
