import type { ButtonHTMLAttributes, Ref } from 'react';
import { Icon, type IconName } from './Icon';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Accessible name and tooltip; icon buttons always carry one (Blueprint 04 §3.2). */
  label: string;
  variant?: 'ghost' | 'subtle' | 'solid';
  size?: 'sm' | 'md';
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={`cb-icon-button cb-icon-button--${variant} cb-icon-button--${size}${className ? ` ${className}` : ''}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
    </button>
  );
}
