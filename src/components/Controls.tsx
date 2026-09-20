"use client";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}

export function SliderRow({ label, value, min, max, step, onChange, format }: SliderRowProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}
