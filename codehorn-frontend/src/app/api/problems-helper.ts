import { PROBLEMS } from '../../data/problems';
import { Problem } from '../../types';

export async function fetchProblemsServer(): Promise<Problem[]> {
  const useGateway = process.env.USE_GATEWAY === 'true';
  const gatewayUrl = process.env.GATEWAY_API_URL || 'http://localhost:6000';

  if (useGateway) {
    try {
      const response = await fetch(`${gatewayUrl}/api/problems`, {
        cache: 'no-store', // ensures fresh data
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Gateway returned status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching problems server-side:', error);
      return PROBLEMS; // fallback
    }
  }

  return PROBLEMS;
}

export async function fetchProblemBySlugServer(slug: string): Promise<Problem | null> {
  const useGateway = process.env.USE_GATEWAY === 'true';
  const gatewayUrl = process.env.GATEWAY_API_URL || 'http://localhost:6000';

  if (useGateway) {
    try {
      const response = await fetch(`${gatewayUrl}/api/problems/${slug}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Gateway returned status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching problem ${slug} server-side:`, error);
      return PROBLEMS.find((p) => p.slug === slug) || null;
    }
  }

  return PROBLEMS.find((p) => p.slug === slug) || null;
}
