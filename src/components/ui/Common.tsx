import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}

export function GlassCard({ children, className, variant = 'light', ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={cn(
        variant === 'light' ? 'glass-card' : 'glass-card-dark',
        'p-6 overflow-hidden',
        className
      ) as string}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    info: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
