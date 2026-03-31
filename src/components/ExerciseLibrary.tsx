import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowRightLeft, X, ArrowLeft, Edit3, RefreshCw, LogOut, Download, Upload, Image, Search, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { createExercise, updateExercise, deleteExercise as deleteExerciseFromDb, subscribeToGifMappings, createGroup, deleteGroup as deleteGroupFromDb, updateGroup } from '../firebase';
import { getGifUrl } from '../data/gifMapping';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ImportExportModal } from './ImportExportModal';
import { useAuth } from '../hooks/useAuth';
import { useExercises } from '../hooks/useExercises';
import { showNotification } from './NotificationModal';

interface ExerciseGroup {
  id: string;
  name: string;
  label: string;
  color_class: string;
  sort_order: number;
}

interface Exercise {
  id: string;
  group_id: string;
  name: string;
  muscles: string[];
  reps: number | null;
  duration: number | null;
  difficulty: string;
  tipo?: 'aerobico' | 'anaerobico';
  description: string;
}

interface ExerciseLibraryProps {
  onBack: () => void;
}

// Sortable Group component for drag-and-drop reordering
function SortableGroup({ 
  group, 
  children, 
  isExpanded,
  onToggle,
  onAddExercise,
  onEditGroup,
  onDeleteGroup,
  exerciseCount,
  missingGifs,
  groupColors
}: { 
  group: ExerciseGroup; 
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onAddExercise: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  exerciseCount: number;
  missingGifs: number;
  groupColors: { id: string; class: string }[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-zinc-900 rounded-xl ${isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}
    >
      {/* Group Header */}
      <button
        id={`group-header-${group.id}`}
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div 
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-700 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5 text-zinc-500" />
          </div>
          <span className={`px-3 py-1 rounded text-sm font-semibold border ${group.color_class}`}>
            {group.label}
          </span>
          <span className="text-base text-zinc-400">
            {exerciseCount} ex{missingGifs > 0 ? ` (${missingGifs} foto mancanti)` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddExercise();
            }}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            title="Aggiungi esercizio"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditGroup();
            }}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            title="Modifica gruppo"
          >
            <Edit3 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Eliminare il gruppo e tutti i suoi esercizi?')) {
                onDeleteGroup();
              }
            }}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            title="Elimina gruppo"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && children}
    </div>
  );
}

export function ExerciseLibrary({ onBack }: ExerciseLibraryProps) {
  const { signOut } = useAuth();
  
  // Use shared exercises context (fetched once, shared across components)
  const { groups, exercises, getExercisesByGroup: getExercisesByGroupCtx, refreshGroups, refreshExercises } = useExercises();
  
  // DnD sensors for group reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle group reordering
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex(g => g.id === active.id);
      const newIndex = groups.findIndex(g => g.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Create new order
        const newGroups = [...groups];
        const [movedGroup] = newGroups.splice(oldIndex, 1);
        newGroups.splice(newIndex, 0, movedGroup);
        
        // Update Firebase with new sort_order values
        try {
          const updates = newGroups.map((g, index) => 
            updateGroup(g.id, { sort_order: index })
          );
          await Promise.all(updates);
          // After Firebase update, refresh to get ordered data
          await refreshGroups();
        } catch (error) {
          console.error('Error reordering groups:', error);
          showNotification('Errore riordinamento gruppi', 'error');
        }
      }
    }
  };
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedExerciseGif, setSelectedExerciseGif] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [createGroupId, setCreateGroupId] = useState<string | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState<string | null>(null);
  const [moveExerciseId, setMoveExerciseId] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [editingGroup, setEditingGroup] = useState<ExerciseGroup | null>(null);
  // State for create exercise form - persists across renders
  const [createExerciseForm, setCreateExerciseForm] = useState<Exercise>({
    id: '',
    group_id: '',
    name: '',
    muscles: [],
    reps: null,
    duration: null,
    difficulty: 'intermediate',
    description: ''
  });
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState('blue');
  const [exerciseGifs, setExerciseGifs] = useState<Record<string, boolean>>({});
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{groupId: string; exerciseIds: string[]}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Subscribe to GIF mappings - real-time updates without repeated reads
  useEffect(() => {
    console.log('[ExerciseLibrary] Setting up GIF mappings listener');
    
    const unsubscribe = subscribeToGifMappings((mappings) => {
      console.log('[ExerciseLibrary] GIF mappings updated:', mappings.length);
      const gifMap: Record<string, boolean> = {};
      mappings.forEach((mapping: any) => {
        if (mapping.exercise_id) {
          gifMap[mapping.exercise_id] = true;
        }
      });
      setExerciseGifs(gifMap);
    });

    return () => {
      console.log('[ExerciseLibrary] Cleaning up GIF mappings listener');
      unsubscribe();
    };
  }, []);

  // Load all exercises for GIF counting - uses context (no-op, context handles loading)
  const loadAllExercisesForGifCount = useCallback(async () => {
    // Data comes from context, no need to reload
  }, []);

  // Load groups from Firebase - uses context (no-op, context handles loading)
  const loadGroups = useCallback(async () => {
    // Data comes from context, no need to reload
  }, []);

  // Load exercises from Firebase - uses context (no-op, context handles loading)
  const loadExercises = useCallback(async () => {
    // Data comes from context, no need to reload
  }, []);

  // Available colors for groups
  const groupColors = [
    { id: 'white', name: 'Bianco', class: 'bg-white/20 text-white border-white/30' },
    { id: 'blue', name: 'Blu', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'green', name: 'Verde', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { id: 'lime', name: 'Lime', class: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
    { id: 'purple', name: 'Viola', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { id: 'pink', name: 'Rosa', class: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    { id: 'orange', name: 'Arancione', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { id: 'red', name: 'Rosso', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { id: 'yellow', name: 'Giallo', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { id: 'gray', name: 'Grigio', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    { id: 'neon-green', name: 'Neon Verde', class: 'bg-green-400/30 text-green-300 border-green-400/50' },
    { id: 'neon-blue', name: 'Neon Azzurro', class: 'bg-blue-400/30 text-blue-300 border-blue-400/50' },
    { id: 'neon-pink', name: 'Neon Rosa', class: 'bg-pink-400/30 text-pink-300 border-pink-400/50' },
  ];

  // Get color class by id
  const getColorClass = (colorId: string) => {
    return groupColors.find(c => c.id === colorId)?.class || groupColors[0].class;
  };

  // Open edit group modal
  const handleEditGroup = (group: ExerciseGroup) => {
    setEditingGroup(group);
    setEditGroupName(group.label);
    // Extract color id from group.color_class
    const found = groupColors.find(c => group.color_class.includes(c.id));
    setEditGroupColor(found?.id || 'blue');
  };

  // Save edited group
  const saveEditGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) return;
    
    try {
      const colorClass = groupColors.find(c => c.id === editGroupColor)?.class || groupColors[0].class;
      await updateGroup(editingGroup.id, {
        name: editGroupName.trim().toLowerCase().replace(/\s+/g, '-'),
        label: editGroupName.trim(),
        color_class: colorClass
      });
      refreshGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      showNotification('Errore aggiornamento gruppo', 'error');
    }
    
    setEditingGroup(null);
  };

  // Get exercises for a specific group (sorted alphabetically)
  const getExercisesByGroup = (groupId: string): Exercise[] => {
    return exercises
      .filter(e => e.group_id === groupId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
        // Scroll the group header into view when expanding, matching CreateWorkout behavior
        setTimeout(() => {
          const element = document.getElementById(`group-header-${groupId}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            const top = rect.top + window.scrollY - 180; // 180px offset to clear sticky header with tabs
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }, 50);
      }
      return next;
    });
  };

  // Delete exercise
  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('Eliminare questo esercizio?')) return;
    await deleteExerciseFromDb(exerciseId);
    refreshExercises();
  };

  // Move exercise to another group
  const moveExercise = async (exerciseId: string, newGroupId: string) => {
    await updateExercise(exerciseId, { group_id: newGroupId });
    setShowGroupSelector(null);
    setMoveExerciseId(null);
    refreshExercises();
  };

  // Add new exercise
  const handleAddExercise = (groupId: string) => {
    setCreateGroupId(groupId);
    setSelectedExercise(null);
    setCreateExerciseForm({
      id: '',
      group_id: groupId,
      name: '',
      muscles: [],
      reps: null,
      duration: null,
      difficulty: 'intermediate',
      description: ''
    });
    setModalMode('create');
  };

  // Delete a group
  const deleteGroup = async (groupId: string) => {
    try {
      // First delete all exercises in the group
      const exercisesInGroup = exercises.filter(e => e.group_id === groupId);
      for (const ex of exercisesInGroup) {
        await deleteExerciseFromDb(ex.id);
      }
      // Then delete the group
      await deleteGroupFromDb(groupId);
      refreshGroups();
      refreshExercises();
    } catch (error) {
      console.error('Error deleting group:', error);
      showNotification('Errore eliminazione gruppo', 'error');
    }
  };

  // Edit exercise - load GIF too
  const handleEditExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCreateGroupId(null);
    setModalMode('edit');
    // Load GIF
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setSelectedExerciseGif(gifUrl);
    } catch {
      setSelectedExerciseGif(null);
    }
  };

  // Called when user clicks Modifica in the modal
  const handleOpenEdit = () => {
    setModalMode('edit');
  };

  // View exercise - load GIF too
  const handleViewExercise = async (exercise: Exercise) => {
    setSelectedExerciseGif(null); // Reset first
    setSelectedExercise(exercise);
    setCreateGroupId(null);
    setModalMode('view');
    // Load GIF
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setSelectedExerciseGif(gifUrl);
    } catch {
      setSelectedExerciseGif(null);
    }
  };

  // Close modal - reload exercises to show updated data and clear GIF
  const handleCloseModal = () => {
    setSelectedExercise(null);
    setSelectedExerciseGif(null);
    setCreateGroupId(null);
    setModalMode('view');
    refreshExercises();
  };

  // Save exercise (create or update)
  const handleSaveExercise = async (exerciseData: Partial<Exercise>) => {
    try {
      if (modalMode === 'create' && createGroupId) {
        const newId = `${createGroupId}-${Date.now()}`;
        await createExercise({
          id: newId,
          group_id: createGroupId,
          name: exerciseData.name || '',
          muscles: exerciseData.muscles || [],
          reps: exerciseData.reps || null,
          duration: exerciseData.duration || null,
          difficulty: exerciseData.difficulty || 'intermediate',
          tipo: exerciseData.tipo || 'anaerobico',
          description: exerciseData.description || ''
        });
      } else if (modalMode === 'edit' && selectedExercise) {
        await updateExercise(selectedExercise.id, {
          name: exerciseData.name,
          muscles: exerciseData.muscles,
          reps: exerciseData.reps,
          duration: exerciseData.duration,
          difficulty: exerciseData.difficulty,
          tipo: exerciseData.tipo,
          description: exerciseData.description
        });
      }
      
      refreshExercises();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving exercise:', err);
      showNotification({
        type: 'alert',
        title: 'Errore',
        message: 'Errore durante il salvataggio',
      });
    }
  };

  // Search exercises
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setExpandedGroups(new Set());
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const results: {groupId: string; exerciseIds: string[]}[] = [];
    
    groups.forEach(group => {
      const groupExercises = exercises.filter(e => e.group_id === group.id);
      const matchingExercises = groupExercises.filter(ex => 
        ex.name.toLowerCase().includes(query)
      );
      
      if (matchingExercises.length > 0) {
        results.push({
          groupId: group.id,
          exerciseIds: matchingExercises.map(ex => ex.id)
        });
      }
    });
    
    setSearchResults(results);
    setIsSearching(true);
    setExpandedGroups(new Set(results.map(r => r.groupId)));
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setExpandedGroups(new Set());
  };

  // Add new group
  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const newGroup = {
        name: newGroupName.trim().toLowerCase().replace(/\s+/g, '-'),
        label: newGroupName.trim(),
        color_class: newGroupColor,
        sort_order: groups.length + 1
      };
      await createGroup(newGroup);
      refreshGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      showNotification('Errore creazione gruppo', 'error');
    }
    
    setNewGroupName('');
    setNewGroupColor('blue');
    setShowAddGroup(false);
  };

  // Group selector modal
  const renderGroupSelector = () => {
    if (!showGroupSelector) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Sposta esercizio</h2>
            <button
              onClick={() => {
                setShowGroupSelector(null);
                setMoveExerciseId(null);
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => moveExerciseId && moveExercise(moveExerciseId, group.id)}
                className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors"
              >
                <span className={`px-3 py-1 rounded text-sm font-semibold border ${group.color_class}`}>
                  {group.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add group modal
  const renderAddGroupModal = () => {
    if (!showAddGroup) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Aggiungi Gruppo</h2>
            <button
              onClick={() => {
                setShowAddGroup(false);
                setNewGroupName('');
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome del gruppo"
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && addGroup()}
            />
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Colore</label>
              <div className="flex flex-wrap gap-2">
                {groupColors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setNewGroupColor(color.id)}
                    className={`px-3 py-1.5 rounded text-sm border ${color.class} ${
                      newGroupColor === color.id ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={addGroup}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Group Modal
  const renderEditGroupModal = () => {
    if (!editingGroup) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Modifica Gruppo</h2>
            <button
              onClick={() => setEditingGroup(null)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <input
              type="text"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              placeholder="Nome del gruppo"
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && saveEditGroup()}
            />
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Colore</label>
              <div className="flex flex-wrap gap-2">
                {groupColors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setEditGroupColor(color.id)}
                    className={`px-3 py-1.5 rounded text-sm border ${color.class} ${
                      editGroupColor === color.id ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={saveEditGroup}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Sticky Header - dark black */}
      <div className="sticky top-0 z-40 bg-zinc-900 backdrop-blur-sm rounded-b-xl border-b-2 border-black/30 -mx-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-bold text-white">Libreria Esercizi</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddGroup(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Gruppo</span>
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Importa/Esporta"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => {
                setExpandedGroups(new Set());
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Comprimi tutto"
            >
              <ChevronUp className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={signOut}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Search Row */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cerca esercizio..."
              className="w-full px-4 py-2 pl-10 bg-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Cerca
          </button>
          {isSearching && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
            >
              X
            </button>
          )}
        </div>
        
        {/* Search Results Info */}
        {isSearching && searchResults.length > 0 && (
          <div className="mt-2 text-sm text-zinc-400">
            Trovati {searchResults.reduce((acc, r) => acc + r.exerciseIds.length, 0)} ex in {searchResults.length} gruppi
          </div>
        )}
        {isSearching && searchResults.length === 0 && searchQuery.trim() && (
          <div className="mt-2 text-sm text-zinc-400">
            Nessun esercizio trovato per "{searchQuery}"
          </div>
        )}
      </div>

      {/* Flat Search Results - shown when searching */}
      {isSearching && searchQuery.trim() && (
        <div className="mt-4 space-y-3">
          <div className="text-sm text-zinc-400">
            Risultati per "{searchQuery}" ({searchResults.reduce((acc, r) => acc + r.exerciseIds.length, 0)} ex)
          </div>
          {searchResults.reduce((acc, r) => acc + r.exerciseIds.length, 0) === 0 ? (
            <div className="bg-zinc-900 rounded-xl px-5 py-8 text-center text-zinc-500">
              Nessun esercizio trovato
            </div>
          ) : (
            exercises
              .filter(ex => {
                const searchResult = searchResults.find(r => r.exerciseIds.includes(ex.id));
                return searchResult !== undefined;
              })
              .map(exercise => {
                const group = groups.find(g => g.id === exercise.group_id);
                return (
                  <div
                    key={exercise.id}
                    className="bg-zinc-900 rounded-xl px-5 py-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleViewExercise(exercise)}
                            className="text-base font-medium text-white hover:text-blue-400 cursor-pointer transition-colors text-left flex items-center gap-2"
                          >
                            {exercise.name}
                            {exerciseGifs[exercise.id] && (
                              <span className="text-green-400 text-xs font-medium flex items-center gap-0.5">
                                <Image className="w-3 h-3" /> GIF
                              </span>
                            )}
                          </button>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            group?.color_class || 'bg-zinc-700 text-zinc-300'
                          }`}>
                            {group?.label || 'Sconosciuto'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-wrap gap-1">
                            {exercise.muscles.map((muscle, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs bg-white/20 text-white">{muscle}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAddToWorkout(exercise)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                              title="Aggiungi alla scheda"
                            >
                              <Plus className="w-4 h-4 text-blue-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Groups List - only shown when NOT searching */}
      {!isSearching && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleGroupDragEnd}
        >
          <SortableContext
            items={groups.map(g => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {groups.map(group => {
                const groupExercises = exercises.filter(e => e.group_id === group.id);
                const missingGifs = groupExercises.length - groupExercises.filter(e => exerciseGifs[e.id]).length;
                return (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    isExpanded={expandedGroups.has(group.id)}
                    onToggle={() => toggleGroup(group.id)}
                    onAddExercise={() => handleAddExercise(group.id)}
                    onEditGroup={() => handleEditGroup(group)}
                    onDeleteGroup={() => deleteGroup(group.id)}
                    exerciseCount={getExercisesByGroup(group.id).length}
                    missingGifs={missingGifs}
                    groupColors={groupColors}
                  >
                    {/* Expanded Content */}
                    <div className="max-h-96 overflow-y-auto scrollbar-dark">
                      {(() => {
                        const exercisesList = getExercisesByGroup(group.id);
                        if (exercisesList.length === 0) {
                          return <div className="px-5 py-8 text-center text-zinc-500">Nessun esercizio</div>;
                        }
                        return exercisesList.map(exercise => (
                          <div key={exercise.id} className="px-5 py-4 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => handleViewExercise(exercise)}
                                    className="text-base font-medium text-white hover:text-blue-400 cursor-pointer transition-colors text-left flex items-center gap-2"
                                  >
                                    {exercise.name}
                                    {exerciseGifs[exercise.id] && (
                                      <span className="text-green-400 text-xs font-medium flex items-center gap-0.5">
                                        <Image className="w-3 h-3" /> GIF
                                      </span>
                                    )}
                                  </button>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ml-2 ${
                                    exercise.tipo === 'aerobico' 
                                      ? 'bg-blue-500/20 text-blue-400' 
                                      : 'bg-orange-500/20 text-orange-400'
                                  }`}>
                                    {exercise.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex flex-wrap gap-1">
                                    {exercise.muscles.map((muscle, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded text-xs bg-white/20 text-white">{muscle}</span>
                                    ))}
                                  </div>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ml-2 ${
                                    exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                    exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {exercise.difficulty === 'beginner' ? 'Principiante' :
                                     exercise.difficulty === 'intermediate' ? 'Intermedi' : 'Avanzato'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setMoveExerciseId(exercise.id);
                                    setShowGroupSelector(exercise.id);
                                  }}
                                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                  title="Sposta"
                                >
                                  <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
                                </button>
                                <button
                                  onClick={() => deleteExercise(exercise.id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                                  title="Elimina"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                      {/* Add exercise button at bottom */}
                      <div className="px-5 py-3 border-t border-zinc-800/50">
                        <button
                          onClick={() => handleAddExercise(group.id)}
                          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Aggiungi esercizio
                        </button>
                      </div>
                    </div>
                  </SortableGroup>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Group Button */}
      {/* Exercise Modal */}
      {(selectedExercise || modalMode === 'create') && (
        <ExerciseDetailModal
          exercise={modalMode === 'create' ? createExerciseForm : selectedExercise!}
          mode={modalMode}
          gifUrl={selectedExerciseGif}
          onClose={handleCloseModal}
          onSave={handleSaveExercise}
          onEdit={handleOpenEdit}
          onGifUpdated={(id, url) => {
            setSelectedExerciseGif(url);
            // Note: GIF mapping listener will auto-update badges
          }}
          groups={groups}
          onMoveGroup={(id, groupId) => moveExercise(id, groupId)}
        />
      )}

      {/* Group Selector Modal */}
      {renderGroupSelector()}

      {/* Add Group Modal */}
      {renderAddGroupModal()}

      {/* Edit Group Modal */}
      {renderEditGroupModal()}

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExportModal onClose={() => setShowImportExport(false)} />
      )}
    </div>
  );
}
