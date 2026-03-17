'use client';

import { useState, useEffect, useRef } from 'react';
import { BacklogItem, MoscowPriority, MOSCOW_CONFIG, Story } from '@/types';
import { t } from '@/lib/translations';

const MOSCOW_ORDER: MoscowPriority[] = ['UNKNOWN', 'MUST', 'SHOULD', 'COULD', 'WONT'];

interface BacklogItemModalProps {
  isOpen: boolean;
  item?: BacklogItem | null;
  allStories: Story[];
  onClose: () => void;
  onSave: (data: Partial<BacklogItem>) => void;
}

export default function BacklogItemModal({
  isOpen,
  item,
  allStories,
  onClose,
  onSave,
}: BacklogItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moscowPriority, setMoscowPriority] = useState<MoscowPriority>('UNKNOWN');
  const [linkedStoryIds, setLinkedStoryIds] = useState<string[]>([]);
  const prevIsOpenRef = useRef(false);

  const isEditing = !!item;

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!justOpened) return;

    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setMoscowPriority(item.moscowPriority);
      setLinkedStoryIds(item.linkedStoryIds || []);
    } else {
      setTitle('');
      setDescription('');
      setMoscowPriority('UNKNOWN');
      setLinkedStoryIds([]);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      moscowPriority,
      linkedStoryIds,
    });
  };

  const toggleStoryLink = (storyId: string) => {
    setLinkedStoryIds(prev =>
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? t.backlog.editItem : t.backlog.newItem}
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
              {t.backlog.itemTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t.backlog.itemTitle}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.backlog.itemDescription}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder={t.backlog.itemDescription}
            />
          </div>

          {/* MoSCoW Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.backlog.moscowPriority}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOSCOW_ORDER.map((p) => {
                const config = MOSCOW_CONFIG[p];
                const isSelected = moscowPriority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMoscowPriority(p)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors text-left
                      ${isSelected
                        ? `${config.bgColor} ${config.color} border-current`
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linked Stories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.backlog.linkedStories}
            </label>
            {allStories.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                {t.backlog.noStories}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                {allStories.map((story) => {
                  const isLinked = linkedStoryIds.includes(story.id);
                  return (
                    <label
                      key={story.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        isLinked ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isLinked}
                        onChange={() => toggleStoryLink(story.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white truncate block">
                          {story.title}
                        </span>
                        {story.assignee && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {story.assignee.name}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        story.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        story.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                        story.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {story.priority}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t.modal.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {isEditing ? t.modal.save : t.modal.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
