'use client';

import { cn } from '@/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const sizes = {
    sm: {
      toggle: 'w-10 h-5',
      dot: 'w-4 h-4',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5',
    },
    md: {
      toggle: 'w-12 h-6',
      dot: 'w-5 h-5',
      translate: checked ? 'translate-x-6' : 'translate-x-0.5',
    },
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
        sizes[size].toggle,
        checked ? 'bg-black' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0 bg-white rounded-full transition-transform shadow-sm',
          sizes[size].dot,
          sizes[size].translate
        )}
      />
    </button>
  );
}
