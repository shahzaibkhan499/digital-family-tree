import { Loader } from '@digital-family-tree/ui';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader size="lg" label="Loading Digital Family Tree..." />
    </div>
  );
}
