import AppLayout from '../../components/AppLayout';
import Playground from '../../components/Playground';

export const dynamic = 'force-dynamic';

export default function PlaygroundPage() {
  return (
    <AppLayout>
      <Playground />
    </AppLayout>
  );
}
