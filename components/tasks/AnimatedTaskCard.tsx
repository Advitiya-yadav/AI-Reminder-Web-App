'use client';

import { CheckCircle2, Circle, Edit2, Trash2, AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import TaskEditor from './TaskEditor';

interface AnimatedTaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    completed: boolean;
    completedAt?: Date;
  };
  token: string;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string, completed: boolean) => void;
  onUpdate?: (task: any) => void;
}

const priorityColors = {
  low: 'text-blue-500 bg-blue-50 border-blue-200',
  medium: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  high: 'text-red-500 bg-red-50 border-red-200',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export default function AnimatedTaskCard({
  task,
  token,
  onDelete,
  onComplete,
  onUpdate,
}: AnimatedTaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const isDueSoon =
    task.dueDate &&
    new Date(task.dueDate) > new Date() &&
    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 &&
    !task.completed;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (onDelete) onDelete(task.id);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleComplete() {
    setIsCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (res.ok) {
        if (onComplete) onComplete(task.id, !task.completed);
      }
    } catch (err) {
      console.error('Error updating task:', err);
    } finally {
      setIsCompleting(false);
    }
  }

  const priority = task.priority || 'medium';
  const priorityColor = priorityColors[priority];
  const priorityLabel = priorityLabels[priority];

  return (
    <>
      <div
        className={`animate-slide-in-bottom p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg ${
          task.completed
            ? 'bg-gray-50 border-gray-200 opacity-75'
            : isOverdue
              ? 'bg-red-50 border-red-300 shadow-md'
              : isDueSoon
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-white border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={isCompleting}
            className="flex-shrink-0 mt-1 transition-transform hover:scale-110 active:scale-95"
          >
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-500 animate-bounce-in" />
            ) : (
              <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <h3
                className={`font-semibold text-lg flex-1 break-words transition-all ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                }`}
              >
                {task.title}
              </h3>
              {isOverdue && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex-shrink-0 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}
              {isDueSoon && !isOverdue && (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  Due Soon
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              {task.priority && (
                <span className={`text-xs font-medium px-2 py-1 rounded border ${priorityColor}`}>
                  {priorityLabel} Priority
                </span>
              )}

              {task.dueDate && (
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString()} at{' '}
                  {new Date(task.dueDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setShowEditor(true)}
              disabled={task.completed}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Editor Modal */}
      {showEditor && (
        <TaskEditor
          taskId={task.id}
          initialTitle={task.title}
          initialDescription={task.description}
          initialDueDate={
            task.dueDate
              ? new Date(task.dueDate).toISOString().slice(0, 16)
              : undefined
          }
          initialPriority={task.priority}
          token={token}
          onSave={(updatedTask) => {
            setShowEditor(false);
            if (onUpdate) onUpdate(updatedTask);
          }}
        />
      )}
    </>
  );
}
