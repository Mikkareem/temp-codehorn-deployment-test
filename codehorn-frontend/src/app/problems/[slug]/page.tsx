import { fetchProblemBySlugServer } from '../../api/problems-helper';
import AppLayout from '../../../components/AppLayout';
import ProblemDetailWrapper from '../../../components/ProblemDetailWrapper';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await fetchProblemBySlugServer(slug);

  if (!problem) {
    notFound();
  }

  return (
    <AppLayout>
      <ProblemDetailWrapper problem={problem} />
    </AppLayout>
  );
}
