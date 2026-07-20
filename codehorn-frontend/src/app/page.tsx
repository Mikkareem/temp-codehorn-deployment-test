import { fetchProblemsServer } from './api/problems-helper';
import AppLayout from '../components/AppLayout';
import ProblemList from '../components/ProblemList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const problems = await fetchProblemsServer();

  return (
    <AppLayout initialProblems={problems}>
      <ProblemList />
    </AppLayout>
  );
}
