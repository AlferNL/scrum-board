'use client';

import { useState, useEffect } from 'react';
import { Column, TaskStatus } from '@/types';
import { t } from '@/lib/translations';

interface ColumnSettingsModalProps {
  columns: Column[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (columns: Column[]) => void;
}

const DEFAULT_COLORS = [
  { color: 'bg-slate-500', bgColor: 'bg-slate-50' },
  { color: 'bg-gray-500', bgColor: 'bg-gray-50' },
  { color: 'bg-red-500', bgColor: 'bg-red-50' },
  { color: 'bg-orange-500', bgColor: 'bg-orange-50' },
  { color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  { color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
  { color: 'bg-lime-500', bgColor: 'bg-lime-50' },
  { color: 'bg-green-500', bgColor: 'bg-green-50' },
  { color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
  { color: 'bg-teal-500', bgColor: 'bg-teal-50' },
  { color: 'bg-cyan-500', bgColor: 'bg-cyan-50' },
  { color: 'bg-sky-500', bgColor: 'bg-sky-50' },
  { color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
  { color: 'bg-violet-500', bgColor: 'bg-violet-50' },
  { color: 'bg-purple-500', bgColor: 'bg-purple-50' },
  { color: 'bg-fuchsia-500', bgColor: 'bg-fuchsia-50' },
  { color: 'bg-pink-500', bgColor: 'bg-pink-50' },
  { color: 'bg-rose-500', bgColor: 'bg-rose-50' },
];

export default function ColumnSettingsModal({
  columns,
  isOpen,
  onClose,
  onSave,
}: ColumnSettingsModalProps) {
  const [editedColumns, setEditedColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEditedColumns([...columns]);
    }
  }, [columns, isOpen]);

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...editedColumns];
    updated[index] = { ...updated[index], title: newTitle };
    setEditedColumns(updated);
  };

  const handleColorChange = (index: number, colorIndex: number) => {
    const updated = [...editedColumns];
    updated[index] = {
      ...updated[index],
      color: DEFAULT_COLORS[colorIndex].color,
      bgColor: DEFAULT_COLORS[colorIndex].bgColor,
    };
    setEditedColumns(updated);
  };

  const handleAddColumn = () => {
    const newId = `custom-${Date.now()}` as TaskStatus;
    const colorIndex = editedColumns.length % DEFAULT_COLORS.length;
    const newColumn: Column = {
      id: newId,
      title: 'Nieuwe Kolom',
      color: DEFAULT_COLORS[colorIndex].color,
      bgColor: DEFAULT_COLORS[colorIndex].bgColor,
    };
    setEditedColumns([...editedColumns, newColumn]);
  };

  const handleDeleteColumn = (index: number) => {
    if (editedColumns.length <= 2) {
      alert('Je moet minimaal 2 kolommen hebben.');
      return;
    }
    const updated = editedColumns.filter((_, i) => i !== index);
    setEditedColumns(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...editedColumns];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setEditedColumns(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === editedColumns.length - 1) return;
    const updated = [...editedColumns];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setEditedColumns(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedColumns);
    onClose();
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kolommen Beheren
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Pas de namen en kleuren van je kolommen aan. Sleep om de volgorde te wijzigen.
          </p>

          {/* Columns List */}
          <div className="space-y-3">
            {editedColumns.map((column, index) => (
              <div 
                key={column.id} 
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                {/* Move Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === editedColumns.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Color Dot */}
                <div className={`w-4 h-4 rounded-full ${column.color} flex-shrink-0`} />

                {/* Title Input */}
                <input
                  type="text"
                  value={column.title}
                  onChange={(e) => handleTitleChange(index, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kolom naam..."
                />

                {/* Color Picker - Show all colors in a grid */}
                <div className="flex flex-wrap gap-1 max-w-[140px]">
                  {DEFAULT_COLORS.map((colorOption, colorIndex) => (
                    <button
                      key={colorIndex}
                      type="button"
                      onClick={() => handleColorChange(index, colorIndex)}
                      className={`w-4 h-4 rounded-full ${colorOption.color} transition-transform hover:scale-125
                        ${column.color === colorOption.color ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-700' : ''}`}
                      title={colorOption.color.replace('bg-', '').replace('-500', '')}
                    />
                  ))}
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(index)}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add Column Button */}
          <button
            type="button"
            onClick={handleAddColumn}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed 
                       border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 
                       hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400
                       transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Kolom Toevoegen
          </button>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
            >
              {t.modal.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                         transition-colors font-medium text-sm"
            >
              {t.modal.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
