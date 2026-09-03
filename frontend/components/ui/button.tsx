import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'ghost' | 'outline' | 'spotify';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  ghost: 'hover:bg-fg/10 hover:text-fg',
  outline: 'border border-fg/20 bg-transparent hover:bg-fg/10',
  spotify:
    'bg-spotify-green text-black font-semibold hover:bg-spotify-green/90 hover:scale-105 transition-transform',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-12 px-6 text-lg',
  icon: 'h-9 w-9 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green disabled:pointer-events-none disabled:opacity-50 active:scale-95';

    // cn, not concatenation: a caller passing rounded-full has to beat the
    // base rounded-lg, and with both in the list the stylesheet order decides.
    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, react-hooks/refs -- cloneElement requires any for arbitrary child props; ref forwarding is intentional
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          classes,
          (children as React.ReactElement<{ className?: string }>).props
            .className,
        ),
        ref,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
