'use client';

interface TextInputProps {
  rawText: string;
  onRawTextChange: (text: string) => void;
  onParse: () => void;
  loading: string | null;
}

const STEP_LABELS: Record<string, string> = {
  entities: 'Extracting entities...',
  relationships: 'Mapping relationships...',
  structure: 'Determining structure...',
  consideration: 'Parsing consideration...',
};

export default function TextInput({ rawText, onRawTextChange, onParse, loading }: TextInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Deal Structurer</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a term sheet, LOI, or deal description below.
        </p>
      </div>
      <textarea
        className="w-full min-h-[12rem] rounded-lg border border-slate-300 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        placeholder='Meridian Capital Partners Fund IV is acquiring 100% of Summit Precision Components from Cascadia Partners for $87M...'
        value={rawText}
        onChange={e => onRawTextChange(e.target.value)}
        disabled={!!loading}
      />
      <div className="flex items-center justify-end gap-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {STEP_LABELS[loading] || 'Processing...'}
          </div>
        )}
        <button
          onClick={() => { if (rawText.trim()) onParse(); }}
          disabled={!!loading}
          className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors ${
            !loading && rawText.trim()
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-blue-400 cursor-not-allowed'
          }`}
        >
          Parse Deal
        </button>
      </div>
    </div>
  );
}
