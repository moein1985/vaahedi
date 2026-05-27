import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--brand-light)] text-[var(--brand)] border border-[hsl(148_24%_82%)]',
        blue: 'bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)]',
        green: 'bg-[hsl(139_50%_37%_/_0.14)] text-[var(--agri-leaf)]',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-[hsl(2_52%_50%_/_0.14)] text-[var(--error-red)]',
        success: 'bg-[hsl(139_50%_37%_/_0.14)] text-[var(--agri-leaf)]',
        warning: 'bg-[hsl(40_62%_57%_/_0.2)] text-[hsl(35_48%_33%)]',
        outline: 'border border-input text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
