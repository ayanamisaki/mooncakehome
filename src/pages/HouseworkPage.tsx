import React, { useState } from 'react';
import { Home, Plus } from 'lucide-react';
import { Card, TaskItem, Modal } from '../components/UI';
import { DailyRecord, Task } from '../types';

interface PageProps {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
}

const HouseworkPage: React.FC<PageProps> = ({ dailyRecord, updateDailyRecord }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const tasks = dailyRecord.tasks.housework || [];

  const handleToggle = (id: string) => {
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        housework: tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
      }
    });
  };

  const handleUpdateTask = (updated: Task) => {
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        housework: tasks.map(t => t.id === updated.id ? updated : t)
      }
    });
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        housework: tasks.filter(t => t.id !== id)
      }
    });
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: newTaskName,
      done: false,
      isFixed: false
    };
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        housework: [...tasks, newTask]
      }
    });
    setNewTaskName('');
  };

  return (
    <div className="space-y-4">
      <Card 
        title="家务清单" 
        icon={<Home className="text-stone-500" size={20} />}
      >
        <div className="space-y-1">
          {tasks.map(task => (
            <TaskItem 
              key={task.id}
              name={task.name}
              done={task.done}
              onToggle={() => handleToggle(task.id)}
              onDelete={task.isFixed ? undefined : () => handleDeleteTask(task.id)}
              onClick={() => setEditingTask(task)}
              note={task.note}
            />
          ))}
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <input 
            type="text" 
            placeholder="新增家务..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-500 transition-all"
          />
          <button 
            onClick={handleAddTask}
            className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/20"
          >
            <Plus size={20} />
          </button>
        </div>
      </Card>

      <Modal 
        isOpen={!!editingTask} 
        onClose={() => setEditingTask(null)} 
        title="编辑家务"
        onSave={() => editingTask && handleUpdateTask(editingTask)}
      >
        {editingTask && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">任务名称</label>
              <input 
                type="text" 
                value={editingTask.name}
                onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">备注</label>
              <textarea 
                value={editingTask.note || ''}
                onChange={(e) => setEditingTask({ ...editingTask, note: e.target.value })}
                className="w-full h-32 bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-amber-500 transition-all"
                placeholder="例如：买了什么，或者具体要求..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HouseworkPage;
