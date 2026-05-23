import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md':
              variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm':
              variant === 'destructive',
            'border border-input bg-background hover:bg-accent/10 hover:text-foreground':
              variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              variant === 'secondary',
            'hover:bg-accent/10 hover:text-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline rounded-none':
              variant === 'link',
          },
          {
            'h-11 px-5 py-2': size === 'default',
            'h-9 px-4': size === 'sm',
            'h-12 px-8 text-base': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
