'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/lib/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { useTheme } from '@/lib/ThemeContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { BacklogItem, MoscowPriority, MOSCOW_CONFIG, Story, Sprint } from '@/types';
import { t } from '@/lib/translations';
import * as XLSX from 'xlsx';
import BacklogItemModal from '@/components/BacklogItemModal';
import StoryModal from '@/components/StoryModal';

const MOSCOW_ORDER: MoscowPriority[] = ['UNKNOWN', 'MUST', 'SHOULD', 'COULD', 'WONT'];

type ViewMode = 'list' | 'board';

export default function BacklogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="text-gray-500 dark:text-gray-400">{t.common.loading}</div></div>}>
      <BacklogContent />
    </Suspense>
  );
}

function BacklogContent() {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, signOut } = useAuth();
  const {
    projects: allProjects,
    users,
    loading,
    createBacklogItem,
    updateBacklogItem,
    deleteBacklogItem,
    createStory,
  } = useSupabaseData();

  // Filter projects: ADMINs see all, others only see projects they're a member of
  const projects = useMemo(() => {
    if (currentUser?.userRole === 'ADMIN') return allProjects;
    return allProjects.filter(p => p.members?.some(m => m.userId === currentUser?.id));
  }, [allProjects, currentUser]);

  // Read project from URL query parameter
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('project');

  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyForBacklogItemId, setStoryForBacklogItemId] = useState<string | null>(null);
  const [storySprintId, setStorySprintId] = useState<string>('');

  // Auto-select first project if none selected
  const selectedProject = useMemo(() => {
    if (selectedProjectId) return projects.find(p => p.id === selectedProjectId);
    if (projects.length > 0) return projects[0];
    return undefined;
  }, [selectedProjectId, projects]);

  // Set selectedProjectId once projects load
  useMemo(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // All sprints in the selected project (for sprint picker)
  const allSprints: Sprint[] = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.sprints || [];
  }, [selectedProject]);

  // All stories from all sprints in the selected project (for linking)
  const allStories: Story[] = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.sprints?.flatMap(s => s.stories || []) || [];
  }, [selectedProject]);

  // Optimistic priority overrides for instant drag feedback
  const [priorityOverrides, setPriorityOverrides] = useState<Record<string, MoscowPriority>>({});

  // Group backlog items by MoSCoW priority
  const groupedItems = useMemo(() => {
    const items = selectedProject?.backlogItems || [];
    const grouped: Record<MoscowPriority, BacklogItem[]> = {
      UNKNOWN: [],
      MUST: [],
      SHOULD: [],
      COULD: [],
      WONT: [],
    };
    for (const item of items) {
      const priority = priorityOverrides[item.id] || item.moscowPriority;
      grouped[priority].push(item);
    }
    return grouped;
  }, [selectedProject, priorityOverrides]);

  const handleSave = async (data: Partial<BacklogItem>) => {
    if (!selectedProject) return;
    if (editingItem) {
      await updateBacklogItem(editingItem.id, data);
    } else {
      await createBacklogItem(selectedProject.id, data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.backlog.deleteConfirm)) {
      await deleteBacklogItem(id);
    }
  };

  const handleEdit = (item: BacklogItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleCreateStoryForItem = (backlogItemId: string) => {
    setStoryForBacklogItemId(backlogItemId);
    // Default to active sprint or first sprint
    const activeSprint = allSprints.find(s => s.isActive) || allSprints[0];
    setStorySprintId(activeSprint?.id || '');
    setStoryModalOpen(true);
  };

  const handleStorySave = async (storyData: Partial<Story> & { sprintId: string }) => {
    const newStoryId = await createStory(storyData);
    // Auto-link the new story to the backlog item
    if (newStoryId && storyForBacklogItemId) {
      const backlogItem = selectedProject?.backlogItems?.find(bi => bi.id === storyForBacklogItemId);
      const existingIds = backlogItem?.linkedStoryIds || [];
      await updateBacklogItem(storyForBacklogItemId, {
        linkedStoryIds: [...existingIds, newStoryId],
      });
    }
    setStoryModalOpen(false);
    setStoryForBacklogItemId(null);
  };

  // Direct placement into active sprint with default DoD
  const handleAddToActiveSprint = async (backlogItemId: string) => {
    const activeSprint = allSprints.find(s => s.isActive);
    if (!activeSprint) {
      alert('Geen actieve sprint gevonden');
      return;
    }
    const backlogItem = selectedProject?.backlogItems?.find(bi => bi.id === backlogItemId);
    if (!backlogItem) return;

    const defaultDoD = (selectedProject?.defaultDefinitionOfDone || []).map(text => ({ text, completed: false }));
    
    const newStoryId = await createStory({
      sprintId: activeSprint.id,
      title: backlogItem.title,
      description: backlogItem.description || '',
      priority: 'medium',
      status: 'OPEN',
      storyPoints: 1,
      definitionOfDone: defaultDoD,
    });

    if (newStoryId) {
      const existingIds = backlogItem.linkedStoryIds || [];
      await updateBacklogItem(backlogItemId, {
        linkedStoryIds: [...existingIds, newStoryId],
      });
    }
  };

  // Drag and drop between MoSCoW categories
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newPriority = destination.droppableId as MoscowPriority;
    const item = selectedProject?.backlogItems?.find(bi => bi.id === draggableId);
    if (!item || item.moscowPriority === newPriority) return;
    // Optimistic update: move item visually immediately
    setPriorityOverrides(prev => ({ ...prev, [draggableId]: newPriority }));
    try {
      await updateBacklogItem(draggableId, { moscowPriority: newPriority });
    } finally {
      setPriorityOverrides(prev => {
        const next = { ...prev };
        delete next[draggableId];
        return next;
      });
    }
  }, [selectedProject, updateBacklogItem]);

  const handleExportExcel = useCallback(() => {
    if (!selectedProject?.backlogItems?.length) return;
    const data = selectedProject.backlogItems.map(item => ({
      Titel: item.title,
      Beschrijving: item.description || '',
      MoSCoW: MOSCOW_CONFIG[item.moscowPriority].label,
      'Gekoppelde Story': (item.linkedStoryIds || []).join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Backlog');
    XLSX.writeFile(wb, `${selectedProject.name}_backlog.xlsx`);
  }, [selectedProject]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/?project=${selectedProject?.id || ''}`}
                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Scrum Board
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {t.backlog.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Project Selector */}
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User Info */}
              {currentUser && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUser.name}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 max-w-7xl mx-auto">
          {!selectedProject ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <p>{t.backlog.selectProject}</p>
            </div>
          ) : (
            <>
              {/* Project Info + View Toggle + Add Button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {selectedProject.name} — {t.backlog.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProject.backlogItems?.length || 0} {t.backlog.items}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      title={t.backlog.viewList}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('board')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'board'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      title={t.backlog.viewBoard}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    title={t.backlog.exportExcel}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.backlog.exportExcel}
                  </button>

                  <button
                    onClick={handleNew}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.backlog.newItem}
                  </button>
                </div>
              </div>

              {/* MoSCoW Groups - List View */}
              {viewMode === 'list' ? (
              <div className="space-y-6">
                {MOSCOW_ORDER.map((priority) => {
                  const config = MOSCOW_CONFIG[priority];
                  const items = groupedItems[priority];

                  return (
                    <div key={priority} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Group Header */}
                      <div className={`px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between ${config.bgColor}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-900/40 rounded-full px-2 py-0.5">
                            {items.length}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      {items.length === 0 ? (
                        <div className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-500 italic">
                          {t.backlog.noItems}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {items.map((item) => (
                            <BacklogItemRow
                              key={item.id}
                              item={item}
                              allStories={allStories}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onCreateStory={handleCreateStoryForItem}
                              onAddToActiveSprint={handleAddToActiveSprint}
                              sprints={allSprints}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              ) : (
              /* MoSCoW Groups - Board View (columns side by side, drag and drop) */
              <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                {MOSCOW_ORDER.map((priority) => {
                  const config = MOSCOW_CONFIG[priority];
                  const items = groupedItems[priority];

                  return (
                    <div key={priority} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                      {/* Column Header */}
                      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${config.bgColor}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-900/40 rounded-full px-2 py-0.5">
                            {items.length}
                          </span>
                        </div>
                      </div>

                      {/* Column Items - Droppable */}
                      <Droppable droppableId={priority}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-2 space-y-2 min-h-[200px] transition-colors ${
                              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {items.length === 0 && !snapshot.isDraggingOver ? (
                              <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500 italic">
                                {t.backlog.noItems}
                              </div>
                            ) : (
                              items.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                  {(dragProvided) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                    >
                                      <BacklogItemCard
                                        item={item}
                                        allStories={allStories}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onCreateStory={handleCreateStoryForItem}
                                        onAddToActiveSprint={handleAddToActiveSprint}
                                        sprints={allSprints}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
              </DragDropContext>
              )}
            </>
          )}
        </main>

        {/* Backlog Item Modal */}
        <BacklogItemModal
          isOpen={isModalOpen}
          item={editingItem}
          allStories={allStories}
          onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
          onSave={handleSave}
        />

        {/* Story Creation Modal (from backlog) */}
        {storyModalOpen && allSprints.length > 0 && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setStoryModalOpen(false)} />
            <div className="relative z-50 w-full max-w-lg mx-4">
              {/* Sprint selector above the story modal */}
              <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium text-sm">{t.backlog.createStory}</span>
                <span className="text-indigo-200 text-sm">—</span>
                <select
                  value={storySprintId}
                  onChange={(e) => setStorySprintId(e.target.value)}
                  className="bg-indigo-700 text-white border border-indigo-400 rounded px-2 py-1 text-sm flex-1"
                >
                  {allSprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isActive ? '(actief)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        <StoryModal
          isOpen={storyModalOpen && !!storySprintId}
          sprintId={storySprintId}
          onClose={() => { setStoryModalOpen(false); setStoryForBacklogItemId(null); }}
          onSave={handleStorySave}
          users={users}
          defaultDefinitionOfDone={selectedProject?.defaultDefinitionOfDone}
        />
      </div>
    </AuthGuard>
  );
}

/* ===== Backlog Item Row ===== */
function BacklogItemRow({
  item,
  allStories,
  onEdit,
  onDelete,
  onCreateStory,
  onAddToActiveSprint,
  sprints,
}: {
  item: BacklogItem;
  allStories: Story[];
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  onCreateStory: (backlogItemId: string) => void;
  onAddToActiveSprint: (backlogItemId: string) => void;
  sprints: Sprint[];
}) {
  const linkedStories = allStories.filter(s => item.linkedStoryIds?.includes(s.id));

  // Find sprint name for a story
  const getSprintName = (story: Story) => {
    const sprint = sprints.find(s => s.id === story.sprintId);
    return sprint?.name;
  };

  return (
    <div className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Linked Stories */}
          {linkedStories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {linkedStories.map((story) => {
                const sprintName = getSprintName(story);
                const statusColor = story.status === 'DONE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : story.status === 'IN_PROGRESS' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                return (
                  <span
                    key={story.id}
                    className={`inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 ${statusColor}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {story.title}
                    {sprintName && <span className="opacity-60">({sprintName})</span>}
                  </span>
                );
              })}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
            {item.createdBy && (
              <span>{t.story.createdBy}: {item.createdBy.name}</span>
            )}
            <span>{item.createdAt.toLocaleDateString('nl-NL')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddToActiveSprint(item.id)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            title={t.backlog.addToActiveSprint}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button
            onClick={() => onCreateStory(item.id)}
            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
            title={t.backlog.createStory}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title={t.story.edit}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title={t.story.delete}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Backlog Item Card (Board view) ===== */
function BacklogItemCard({
  item,
  allStories,
  onEdit,
  onDelete,
  onCreateStory,
  onAddToActiveSprint,
  sprints,
}: {
  item: BacklogItem;
  allStories: Story[];
  onEdit: (item: BacklogItem) => void;
  onDelete: (id: string) => void;
  onCreateStory: (backlogItemId: string) => void;
  onAddToActiveSprint: (backlogItemId: string) => void;
  sprints: Sprint[];
}) {
  const linkedStories = allStories.filter(s => item.linkedStoryIds?.includes(s.id));

  const getSprintName = (story: Story) => {
    const sprint = sprints.find(s => s.id === story.sprintId);
    return sprint?.name;
  };

  return (
    <div
      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onEdit(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 flex-1">
          {item.title}
        </h4>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToActiveSprint(item.id); }}
            className="p-1 text-gray-300 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400"
            title={t.backlog.addToActiveSprint}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCreateStory(item.id); }}
            className="p-1 text-gray-300 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400"
            title={t.backlog.createStory}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-1 text-gray-300 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {item.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {item.description}
        </p>
      )}
      {linkedStories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {linkedStories.map((story) => {
            const sprintName = getSprintName(story);
            const statusColor = story.status === 'DONE' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
              : story.status === 'IN_PROGRESS' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300'
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300';
            return (
              <span
                key={story.id}
                className={`inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 ${statusColor}`}
              >
                {story.title}
                {sprintName && <span className="opacity-60 text-[10px]">({sprintName})</span>}
              </span>
            );
          })}
        </div>
      )}
      {item.createdBy && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
          {item.createdBy.name}
        </p>
      )}
    </div>
  );
}
