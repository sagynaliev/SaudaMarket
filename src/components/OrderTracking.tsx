import React from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Package, Truck, Home } from 'lucide-react';

type Status = 'pending' | 'confirmed' | 'shipped' | 'delivered';

interface OrderTrackingProps {
  currentStatus: Status;
}

const steps = [
  { id: 'pending', label: 'Processing', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', icon: Package },
  { id: 'shipped', label: 'In Transit', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

export function OrderTracking({ currentStatus }: OrderTrackingProps) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full py-12 px-4 max-w-xl mx-auto">
      <div className="relative flex justify-between gap-2">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10" />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          className="absolute top-5 left-0 h-0.5 bg-accent"
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isActive || isCompleted ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none'
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive || isCompleted ? 'border-accent' : 'border-white/5'
                } bg-slate-900 transition-colors shrink-0`}
              >
                {isCompleted ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                )}
              </motion.div>
              
              <div className="mt-4 w-full text-center">
                <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-tight leading-none px-1 ${
                  isActive ? 'text-accent' : 'text-slate-500'
                }`}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="w-1 h-1 bg-accent rounded-full mx-auto mt-1"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
