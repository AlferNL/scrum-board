'use client';

import { useState, useEffect } from 'react';
import { Project, User, ProjectRole, PROJECT_ROLE_CONFIG } from '@/types';
import { t } from '@/lib/translations';
import Image from 'next/image';

interface ProjectModalProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  onDelete?: (projectId: string) => void;
  users?: User[];
  // Project member management
  onAddMember?: (projectId: string, userId: string, role: ProjectRole) => Promise<void>;
  onUpdateMemberRole?: (projectId: string, userId: string, role: ProjectRole) => Promise<void>;
  onRemoveMember?: (projectId: string, userId: string) => Promise<void>;
}

const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export default function ProjectModal({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
  users = [],
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
}: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    webhookUrl: '',
    teamMemberIds: [] as string[],
    defaultDefinitionOfDone: [] as string[],
  });
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('MEMBER');
  const [newDodItem, setNewDodItem] = useState('');

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color,
        webhookUrl: project.webhookUrl || '',
        teamMemberIds: project.teamMembers.map((u) => u.id),
        defaultDefinitionOfDone: project.defaultDefinitionOfDone || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
        webhookUrl: '',
        teamMemberIds: [],
        defaultDefinitionOfDone: [],
      });
    }
    setNewDodItem('');
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const teamMembers = users.filter((u) => formData.teamMemberIds.includes(u.id));
    
    onSave({
      ...(project && { id: project.id, sprints: project.sprints }),
      name: formData.name,
      description: formData.description,
      color: formData.color,
      webhookUrl: formData.webhookUrl || undefined,
      defaultDefinitionOfDone: formData.defaultDefinitionOfDone,
      teamMembers,
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (project && onDelete && confirm(t.modal.confirmDelete)) {
      onDelete(project.id);
      onClose();
    }
  };

  const toggleTeamMember = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(userId)
        ? prev.teamMemberIds.filter((id) => id !== userId)
        : [...prev.teamMemberIds, userId],
    }));
  };

  // Handler for adding a new member with role
  const handleAddMember = async () => {
    if (project && newMemberUserId && onAddMember) {
      await onAddMember(project.id, newMemberUserId, newMemberRole);
      setNewMemberUserId('');
      setNewMemberRole('MEMBER');
    }
  };

  // Handler for changing a member's role
  const handleRoleChange = async (userId: string, role: ProjectRole) => {
    if (project && onUpdateMemberRole) {
      await onUpdateMemberRole(project.id, userId, role);
    }
  };

  // Handler for removing a member
  const handleRemoveMember = async (userId: string) => {
    if (project && onRemoveMember) {
      await onRemoveMember(project.id, userId);
    }
  };

  // Get users not yet added to the project (for adding new members)
  const availableUsers = isEditing
    ? users.filter(u => !project?.members?.some(m => m.userId === u.id))
    : [];

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
            {isEditing ? t.modal.editProject : t.modal.newProject}
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
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.projectName} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Mijn Project"
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              placeholder="Beschrijving van het project..."
            />
          </div>

          {/* Project Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.modal.projectColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Teams Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.webhookUrl}
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              placeholder="https://outlook.office.com/webhook/..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t.modal.webhookDescription}
            </p>
          </div>

          {/* Default Definition of Done */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.modal.defaultDefinitionOfDone}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t.modal.defaultDodDescription}
            </p>
            
            {/* Current DoD items */}
            {formData.defaultDefinitionOfDone.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {formData.defaultDefinitionOfDone.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        defaultDefinitionOfDone: formData.defaultDefinitionOfDone.filter((_, i) => i !== index),
                      })}
                      className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
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
                      defaultDefinitionOfDone: [...formData.defaultDefinitionOfDone, newDodItem.trim()],
                    });
                    setNewDodItem('');
                  }
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t.modal.defaultDodPlaceholder}
              />
              <button
                type="button"
                onClick={() => {
                  if (newDodItem.trim()) {
                    setFormData({
                      ...formData,
                      defaultDefinitionOfDone: [...formData.defaultDefinitionOfDone, newDodItem.trim()],
                    });
                    setNewDodItem('');
                  }
                }}
                disabled={!newDodItem.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                           disabled:dark:bg-gray-600 text-white rounded-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Team Members / Project Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEditing ? t.modal.projectMembers : t.modal.teamMembers}
            </label>
            
            {isEditing && project?.members ? (
              // Role-based member management for existing projects
              <div className="space-y-3">
                {/* Current Members List */}
                {project.members.length > 0 ? (
                  <div className="space-y-2">
                    {project.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                      >
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.user.name}</p>
                        </div>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value as ProjectRole)}
                          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-500 
                                     bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200
                                     focus:ring-1 focus:ring-blue-500"
                        >
                          {(Object.keys(PROJECT_ROLE_CONFIG) as ProjectRole[]).map((role) => (
                            <option key={role} value={role}>{PROJECT_ROLE_CONFIG[role].label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title={t.modal.removeMember}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">{t.modal.noMembers}</p>
                )}

                {/* Add New Member */}
                {availableUsers.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <select
                      value={newMemberUserId}
                      onChange={(e) => setNewMemberUserId(e.target.value)}
                      className="flex-1 text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-500 
                                 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      <option value="">{t.modal.selectUser}</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as ProjectRole)}
                      className="text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-500 
                                 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      {(Object.keys(PROJECT_ROLE_CONFIG) as ProjectRole[]).map((role) => (
                        <option key={role} value={role}>{PROJECT_ROLE_CONFIG[role].label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={!newMemberUserId}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                                 disabled:dark:bg-gray-600 text-white rounded transition-colors"
                    >
                      {t.modal.addMember}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Simple selection for new projects
              <div className="grid grid-cols-2 gap-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleTeamMember(user.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors text-left
                      ${formData.teamMemberIds.includes(user.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                  >
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      unoptimized
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                    </div>
                    {formData.teamMemberIds.includes(user.id) && (
                      <svg className="w-4 h-4 text-blue-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                           hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-sm"
              >
                {t.modal.delete}
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-3">
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
                {isEditing ? t.modal.save : t.modal.create}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
