'use client';

import { Flag } from '@/lib/flags';

interface FlagsPanelProps {
  flags: Flag[];
}

const SEVERITY_STYLES: Record<Flag['severity'], { bg: string; border: string; icon: string; iconColor: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: '\u26A0', iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '\u26A0', iconColor: 'text-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '\u2139', iconColor: 'text-blue-400' },
};

export default function FlagsPanel({ flags }: FlagsPanelProps) {
  if (flags.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800">Flags</h2>
      <div className="space-y-2">
        {flags.map((flag, i) => {
          const style = SEVERITY_STYLES[flag.severity];
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-lg leading-none ${style.iconColor}`}>{style.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{flag.title}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{flag.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
