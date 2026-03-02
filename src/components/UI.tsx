import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onAdd?: () => void;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, defaultOpen = true, onAdd, icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm mb-4 overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-stone-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="p-1 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all"
            >
              <Plus size={20} />
            </button>
          )}
          {isOpen ? <ChevronDown size={20} className="text-stone-400" /> : <ChevronRight size={20} className="text-stone-400" />}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-stone-100 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TaskItemProps {
  name: string;
  done: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  note?: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({ name, done, onToggle, onDelete, onClick, note }) => {
  return (
    <div className="group flex flex-col py-2 border-b border-stone-50 last:border-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "transition-colors duration-200",
            done ? "text-stone-400" : "text-stone-300 hover:text-amber-500"
          )}
        >
          {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div 
          className="flex-1 cursor-pointer min-w-0"
          onClick={onClick}
        >
          <div className={cn(
            "text-sm font-medium transition-all duration-200 truncate",
            done ? "text-stone-400 line-through" : "text-stone-700"
          )}>
            {name}
          </div>
          {note && (
            <div className="text-[11px] text-stone-400 truncate mt-0.5">
              {note}
            </div>
          )}
        </div>
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
}> = ({ isOpen, onClose, title, children, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-bold text-stone-800">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <ChevronDown size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        {onSave && (
          <div className="p-4 border-t border-stone-100 bg-white">
            <button 
              onClick={onSave}
              className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
            >
              保存
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
