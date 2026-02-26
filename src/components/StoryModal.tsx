'use client';

import { useState, useEffect } from 'react';
import { Story, Priority, User, StoryStatus, STORY_STATUS_CONFIG } from '@/types';
import { t } from '@/lib/translations';

interface StoryModalProps {
  story?: Story | null;
  sprintId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (story: Partial<Story> & { sprintId: string }) => void;
  onDelete?: (storyId: string) => void;
  users?: User[];
  defaultDefinitionOfDone?: string[];
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: t.priority.low },
  { value: 'medium', label: t.priority.medium },
  { value: 'high', label: t.priority.high },
  { value: 'critical', label: t.priority.critical },
];

export default function StoryModal({
  story,
  sprintId,
  isOpen,
  onClose,
  onSave,
  onDelete,
  users = [],
  defaultDefinitionOfDone = [],
}: StoryModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    status: 'OPEN' as StoryStatus,
    assigneeId: '',
    definitionOfDone: [] as { text: string; completed: boolean }[],
  });
  const [newDodItem, setNewDodItem] = useState('');

  const isEditing = !!story;

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title,
        description: story.description || '',
        priority: story.priority,
        status: story.status || 'OPEN',
        assigneeId: story.assignee?.id || '',
        definitionOfDone: story.definitionOfDone || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'OPEN',
        assigneeId: '',
        definitionOfDone: defaultDefinitionOfDone.map(text => ({ text, completed: false })),
      });
    }
    setNewDodItem('');
  }, [story, isOpen, defaultDefinitionOfDone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignee = users.find((u) => u.id === formData.assigneeId);
    
    onSave({
      ...(story && { id: story.id, tasks: story.tasks }),
      sprintId,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      storyPoints: 1, // Default value, not used for display anymore
      assignee,
      definitionOfDone: formData.definitionOfDone,
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (story && onDelete && confirm(t.modal.confirmDelete)) {
      onDelete(story.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? t.modal.editStory : t.modal.newStory}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.title} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Story titel..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              placeholder="Beschrijving van de user story..."
            />
          </div>

          {/* Priority */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.modal.priority}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
          </div>

          {/* Status */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.modal.status}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StoryStatus })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {(Object.keys(STORY_STATUS_CONFIG) as StoryStatus[]).map((status) => (
                  <option key={status} value={status}>{t.storyStatus[status]}</option>
                ))}
              </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.assignee}
            </label>
            <select
              value={formData.assigneeId}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t.common.selectAssignee}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* Definition of Done */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.definitionOfDone}
            </label>
            {/* Existing DoD items with checkboxes */}
            {formData.definitionOfDone.length > 0 && (
              <ul className="mb-2 space-y-1">
                {formData.definitionOfDone.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 
                                             bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        const updated = [...formData.definitionOfDone];
                        updated[index] = { ...updated[index], completed: !updated[index].completed };
                        setFormData({ ...formData, definitionOfDone: updated });
                      }}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded 
                                 focus:ring-green-500 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        definitionOfDone: formData.definitionOfDone.filter((_, i) => i !== index),
                      })}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                      title={t.common.delete}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* DoD progress */}
            {formData.definitionOfDone.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{formData.definitionOfDone.filter(d => d.completed).length}/{formData.definitionOfDone.length} voltooid</span>
                  <span>{Math.round((formData.definitionOfDone.filter(d => d.completed).length / formData.definitionOfDone.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(formData.definitionOfDone.filter(d => d.completed).length / formData.definitionOfDone.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {/* Add new DoD item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDodItem}
                onChange={(e) => setNewDodItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDodItem.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      definitionOfDone: [...formData.definitionOfDone, { text: newDodItem.trim(), completed: false }],
                    });
                    setNewDodItem('');
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                placeholder={t.modal.definitionOfDonePlaceholder}
              />
              <button
                type="button"
                onClick={() => {
                  if (newDodItem.trim()) {
                    setFormData({
                      ...formData,
                      definitionOfDone: [...formData.definitionOfDone, { text: newDodItem.trim(), completed: false }],
                    });
                    setNewDodItem('');
                  }
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg 
                           transition-colors text-sm font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                {t.modal.delete}
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 
                           dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 
                           rounded-lg transition-colors"
              >
                {t.modal.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                           transition-colors font-medium"
              >
                {isEditing ? t.modal.save : t.modal.create}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
