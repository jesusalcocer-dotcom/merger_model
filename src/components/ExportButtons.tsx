'use client';

import { DealState } from '@/types/deal';

interface ExportButtonsProps {
  deal: DealState;
}

export default function ExportButtons({ deal }: ExportButtonsProps) {
  const jsonStr = JSON.stringify(deal, null, 2);

  const downloadJson = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deal-structure.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(jsonStr);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadJson}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Export JSON
      </button>
      <button
        onClick={copyJson}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Copy JSON
      </button>
    </div>
  );
}
