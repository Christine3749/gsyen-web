import { useEffect, useRef, useState } from 'react';

export interface ModelStatusSelectOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ModelStatusSelectProps<T extends string> {
  label: string;
  value: T;
  options: ModelStatusSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function ModelStatusSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: ModelStatusSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (option: ModelStatusSelectOption<T>) => {
    if (option.disabled || disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`gsyen-system-panel-select has-custom ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <label>{label}</label>
      <button
        type="button"
        className="gsyen-system-panel-select-button"
        onClick={() => !disabled && setOpen(v => !v)}
        aria-expanded={open}
        disabled={disabled}
      >
        <span>{selected?.label ?? value}</span>
        <i aria-hidden="true" />
      </button>
      <div className="gsyen-system-panel-select-menu" role="listbox">
        {options.map(option => (
          <button
            type="button"
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            disabled={option.disabled || disabled}
            className={option.value === value ? 'is-selected' : ''}
            onClick={() => choose(option)}
          >
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
