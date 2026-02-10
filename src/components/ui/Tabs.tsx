'use client';

interface TabsProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'pills';
}

export default function Tabs({ tabs, active, onChange, variant = 'default' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className="flex gap-1 bg-bg-primary rounded-md p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              active === tab.value
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === tab.value
              ? 'border-accent text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
