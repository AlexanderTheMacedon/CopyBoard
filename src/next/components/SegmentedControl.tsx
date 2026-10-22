import { useRef, type KeyboardEvent } from 'react';
import { Icon, type IconName } from './Icon';

export interface SegmentOption<V extends string> {
  readonly value: V;
  readonly label: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

interface SegmentedControlProps<V extends string> {
  label: string;
  options: readonly SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Show icons only; labels stay as accessible names and tooltips. */
  iconOnly?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/** Single choice as an ARIA radio group with roving tabindex and arrow-key navigation. */
export function SegmentedControl<V extends string>({
  label,
  options,
  value,
  onChange,
  iconOnly = false,
  size = 'md',
  className,
}: SegmentedControlProps<V>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.filter((o) => !o.disabled);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const current = enabled.findIndex((o) => o.value === value);
    const nextIndex =
      event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (current + (step ?? 0) + enabled.length) % enabled.length;
    const next = enabled[nextIndex];
    if (!next) return;
    onChange(next.value);
    refs.current[options.indexOf(next)]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`cb-segmented cb-segmented--${size}${className ? ` ${className}` : ''}`}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            tabIndex={checked ? 0 : -1}
            disabled={option.disabled}
            className="cb-segmented__option"
            onClick={() => onChange(option.value)}
          >
            {option.icon && <Icon name={option.icon} size={size === 'sm' ? 16 : 18} />}
            {!iconOnly && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
