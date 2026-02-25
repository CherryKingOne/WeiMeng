import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent',
          'focus:border-black focus:bg-white outline-none text-sm text-gray-900',
          'placeholder:text-gray-400',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
