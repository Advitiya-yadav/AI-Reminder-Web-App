'use client';
import React, { useState } from 'react';
import { Star, Settings2, Trash2, Loader2, CheckCircle2, Circle } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  currentProgress: number;
  totalProgress: number;
  unit: string;
  date: string;
  time: string;
  reminderOffset?: string;
};

type TaskCardProps = {
  task: Task;
  onEditTrigger: (task: Task) => void;
  onDeleteTrigger: (taskId: string) => Promise<void>;
  onToggleComplete: (taskId: string) => Promise<void>; // NEW: Prop callback to update state/backend
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEditTrigger, onDeleteTrigger, onToggleComplete }) => {
  const percentage = task.totalProgress > 0 ? (task.currentProgress / task.totalProgress) * 100 : 0;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteTrigger(task.id);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckboxClick = async () => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      await onToggleComplete(task.id);
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`animate-slide-in-bottom bg-white border border-gray-300 rounded-2xl p-3 sm:p-4 text-left shadow-sm transition-all duration-200 ${
      isDeleting ? 'opacity-50 pointer-events-none' : ''
    } ${task.completed ? 'border-emerald-200 bg-emerald-50/10' : ''}`} style={{ willChange: 'transform, opacity' }}>
      {/* Entrance animation */}
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3">
        {/* NEW: Left-side Alignment layout holding your click Checkbox */}
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <button 
            onClick={handleCheckboxClick}
            disabled={isToggling}
            className={`mt-0.5 shrink-0 transition-colors duration-150 focus:outline-none ${
              task.completed ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-400'
            }`}
            title={task.completed ? "Mark as Incomplete" : "Mark as Complete"}
          >
            {isToggling ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : task.completed ? (
              <CheckCircle2 size={18} fill="currentColor" className="text-white fill-emerald-500" />
            ) : (
              <Circle size={18} />
            )}
          </button>

          {/* Task Heading Text - Dims and strikes through when checked off */}
          <span className={`font-medium text-sm transition-all duration-150 break-words ${
            task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}>
            {task.title}
          </span>
        </div>
        
        {/* Action button controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => onEditTrigger(task)}
            className="text-gray-500 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-lg transition"
            title="Edit Task Settings"
            disabled={isDeleting}
          >
            <Settings2 size={16} />
          </button>

          <button 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition"
            title="Delete Task"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      {/* Metadata Badges - Responsive wrapping */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 pl-6 sm:pl-8 mt-2">
        {task.date && <span className="bg-[#EAEAEA] px-2 py-1 rounded-md">{task.date}</span>}
        {task.time && <span className="bg-[#EAEAEA] px-2 py-1 rounded-md">{task.time}</span>}
        {task.category && <span className="bg-[#FFF3E6] text-[#8A4B12] px-2 py-1 rounded-md capitalize">{task.category}</span>}
        {task.reminderOffset && (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md">
            Alert: {task.reminderOffset}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;