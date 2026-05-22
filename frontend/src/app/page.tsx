'use client';

import { AnalysisWorkflow } from '@/components/analysis-workflow';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <AnalysisWorkflow />
    </div>
  );
}
