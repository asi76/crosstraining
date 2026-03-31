import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, ChevronDown, ChevronUp, ArrowLeft, Target, Image, Shield, RefreshCw, LogOut, GripVertical, Edit3, ArrowRightLeft, Search, Wand, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createWorkout, updateWorkout, updateExercise } from '../firebase';
import { getGifUrl } from '../data/gifMapping';
import { Workout } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useExercises } from '../hooks/useExercises';
import { ExerciseDetailModal } from './ExerciseDetailModal';

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

interface CreateWorkoutProps {
  onBack: () => void;
  onSave: (workout: any) => void;
  editWorkout?: Workout | null;
}

// Fixed workout categories
const WORKOUT_CATEGORIES = [
  { id: 'forza', name: 'Forza' },
  { id: 'cardio1', name: 'Cardio 1' },
  { id: 'cardio2', name: 'Cardio 2' }
];

// Default workout categories (tabs)
const DEFAULT_CATEGORIES = [
  { id: 'forza', name: 'Forza', exercises: [] },
  { id: 'cardio1', name: 'Cardio 1', exercises: [] },
  { id: 'cardio2', name: 'Cardio 2', exercises: [] }
];

export function CreateWorkout({ onBack, onSave, editWorkout }: CreateWorkoutProps) {
  const { user, role, signOut } = useAuth();
  
  // Initialize categories: merge saved categories with defaults to ensure all tabs exist
  const getInitialCategories = () => {
    if (!editWorkout?.stations || editWorkout.stations.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    // Merge saved stations with default categories (fill missing categories with empty exercises)
    const savedCategoryIds = new Set(editWorkout.stations.map((s: any) => s.id));
    const missingCategories = DEFAULT_CATEGORIES.filter(c => !savedCategoryIds.has(c.id));
    return [...editWorkout.stations, ...missingCategories];
  };
  
  const [workoutName, setWorkoutName] = useState(editWorkout?.name || '');
  const [workoutCategories, setWorkoutCategories] = useState<any[]>(getInitialCategories);
  
  // Track original workout ID to ensure we update (not create) even if editWorkout becomes null
  const originalWorkoutIdRef = useRef<string | null>(editWorkout?.id || null);
  const isEditing = originalWorkoutIdRef.current !== null;
  
  // Log for debugging
  console.log('[CreateWorkout] editWorkout:', editWorkout, 'isEditing:', isEditing);
  const [selectedCategoryId, setSelectedCategoryId] = useState('forza');
  
  // Use shared exercises context (fetched once, shared across components)
  const { groups, exercises, getExercisesByGroup: getExercisesByGroupCtx } = useExercises();
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [viewingExerciseGif, setViewingExerciseGif] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [viewingExerciseIndex, setViewingExerciseIndex] = useState<number | null>(null);
  const [editingExerciseInModal, setEditingExerciseInModal] = useState(false);
  const [moveExerciseModal, setMoveExerciseModal] = useState<{ exerciseIndex: number; fromCategory: string } | null>(null);
  const [fullEditModalExercise, setFullEditModalExercise] = useState<Exercise | null>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{groupId: string; exerciseIds: string[]}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // AI Auto-fill functionality
  const [isAiLoading, setIsAiLoading] = useState(false);

  const currentCategory = workoutCategories.find(c => c.id === selectedCategoryId) || workoutCategories[0];

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder exercises within same category
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!currentCategory) return;

    const oldIndex = currentCategory.exercises.findIndex((_: any, i: number) => `${selectedCategoryId}-${i}` === active.id);
    const newIndex = currentCategory.exercises.findIndex((_: any, i: number) => `${selectedCategoryId}-${i}` === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newCategories = workoutCategories.map(cat => ({
      ...cat,
      exercises: [...cat.exercises]
    }));
    const catIndex = newCategories.findIndex(c => c.id === selectedCategoryId);
    if (catIndex === -1) return;

    const [removed] = newCategories[catIndex].exercises.splice(oldIndex, 1);
    newCategories[catIndex].exercises.splice(newIndex, 0, removed);
    setWorkoutCategories(newCategories);
  };

  // Sortable exercise item component
  function SortableExerciseItem({ ex, index }: { ex: any; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: `${selectedCategoryId}-${index}`,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    const exerciseData = getExerciseById(ex.exerciseId);
    const exerciseGroup = groups.find(g => g.id === ex.groupId);
    const groupLabel = exerciseGroup?.label || 'Nessun gruppo';

    // Count muscle occurrences in the current category (all three tabs)
    const muscleCount: Record<string, number> = {};
    workoutCategories.forEach(cat => {
      cat.exercises.forEach((e: any) => {
        const data = getExerciseById(e.exerciseId);
        data?.muscles?.forEach((m: string) => {
          muscleCount[m] = (muscleCount[m] || 0) + 1;
        });
      });
    });
    const getMuscleColor = (muscle: string) => {
      const count = muscleCount[muscle] || 1;
      if (count >= 4) return 'bg-red-500/40 text-red-300 border border-red-500/50';
      if (count === 3) return 'bg-orange-500/40 text-orange-300 border border-orange-500/50';
      if (count === 2) return 'bg-yellow-500/40 text-yellow-300 border border-yellow-500/50';
      return 'bg-green-500/30 text-green-300 border border-green-500/40';
    };

    // Handle group change
    const handleGroupChange = (newGroupId: string) => {
      const newCategories = [...workoutCategories];
      const catIndex = newCategories.findIndex(c => c.id === selectedCategoryId);
      if (catIndex !== -1) {
        newCategories[catIndex].exercises[index].groupId = newGroupId;
        setWorkoutCategories(newCategories);
      }
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-dark-bg rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-zinc-800/50 transition-colors w-full mb-2 last:mb-0"
      >
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              className="p-1 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); handleViewExercise(exerciseData!, index); }}
                className="text-left hover:text-blue-400 transition-colors"
              >
                <span className="text-white text-base font-medium block">
                  {ex.exerciseName || ex.exerciseId}
                </span>
              </button>
              <div className="flex flex-wrap gap-1 mt-1">
                {exerciseData?.muscles?.slice(0, 3).map((m: string, i: number) => (
                  <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${getMuscleColor(m)}`}>{m}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setMoveExerciseModal({ exerciseIndex: index, fromCategory: selectedCategoryId }); }}
              className="p-1.5 text-zinc-500 hover:text-blue-400"
              title="Sposta esercizio"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // Load GIF first before opening modal
                setViewingExerciseGif(null);
                try {
                  const gifUrl = await getGifUrl(exerciseData!.id);
                  setViewingExerciseGif(gifUrl);
                } catch {}
                setFullEditModalExercise(exerciseData!);
              }}
              className="p-1.5 text-zinc-500 hover:text-blue-400"
              title="Modifica esercizio"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveExercise(selectedCategoryId, index); }}
              className="p-1.5 text-zinc-500 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if there are unsaved changes
  const initialName = editWorkout?.name || '';
  const initialStations = editWorkout?.stations || [
    { id: 'forza', name: 'Forza', exercises: [] },
    { id: 'cardio1', name: 'Cardio 1', exercises: [] },
    { id: 'cardio2', name: 'Cardio 2', exercises: [] }
  ];
  const hasChanges = workoutName !== initialName || JSON.stringify(workoutCategories) !== JSON.stringify(initialStations);

  const handleUnsavedChanges = (action: () => void) => {
    const currentHasChanges = workoutName !== initialName || JSON.stringify(workoutCategories) !== JSON.stringify(initialStations);
    if (!currentHasChanges) {
      action();
      return;
    }
    const save = confirm('Ci sono modifiche non salvate. Vuoi salvare prima di uscire?');
    if (save) {
      handleSave();
    }
    action();
  };

  // Get exercises for a specific group (sorted alphabetically) - uses context
  const getExercisesByGroup = (groupId: string): Exercise[] => {
    return getExercisesByGroupCtx(groupId).sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
        // Scroll the group header into view when expanding
        setTimeout(() => {
          const element = document.getElementById(`workout-group-header-${groupId}`);
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

  // Add exercise to current category and collapse the group it belongs to
  const handleAddExercise = (exercise: Exercise, groupId: string) => {
    // Check if exercise already exists in any category
    const alreadyExists = workoutCategories.some(cat =>
      cat.exercises.some(ex => ex.exerciseId === exercise.id)
    );
    if (alreadyExists) {
      setDuplicateError(exercise.name);
      return;
    }

    const newExercise = {
      exerciseId: exercise.id,
      groupId: groupId,
      sets: exercise.reps ? 3 : 4,
      reps: exercise.reps || 10,
      rest: 60,
      exerciseName: exercise.name
    };

    const newCategories = [...workoutCategories];
    const catIndex = newCategories.findIndex(c => c.id === selectedCategoryId);
    if (catIndex !== -1) {
      newCategories[catIndex].exercises.push(newExercise);
      setWorkoutCategories(newCategories);
    }

    // Collapse the group after adding
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  };

  const handleRemoveExercise = (categoryId: string, exerciseIndex: number) => {
    const newCategories = workoutCategories.map(cat => ({
      ...cat,
      exercises: [...cat.exercises]
    }));
    const catIndex = newCategories.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      newCategories[catIndex].exercises.splice(exerciseIndex, 1);
      setWorkoutCategories(newCategories);
    }
  };

  // Move exercise to another category
  const handleMoveExercise = (toCategoryId: string) => {
    if (!moveExerciseModal) return;
    const { exerciseIndex, fromCategory } = moveExerciseModal;
    if (fromCategory === toCategoryId) {
      setMoveExerciseModal(null);
      return;
    }

    const newCategories = workoutCategories.map(cat => ({
      ...cat,
      exercises: [...cat.exercises]
    }));
    const fromCatIndex = newCategories.findIndex(c => c.id === fromCategory);
    const toCatIndex = newCategories.findIndex(c => c.id === toCategoryId);
    
    if (fromCatIndex !== -1 && toCatIndex !== -1) {
      const [removed] = newCategories[fromCatIndex].exercises.splice(exerciseIndex, 1);
      newCategories[toCatIndex].exercises.push(removed);
      setWorkoutCategories(newCategories);
    }
    setMoveExerciseModal(null);
  };

  // View exercise
  const handleViewExercise = async (exercise: Exercise, exerciseIndex?: number) => {
    setViewingExerciseGif(null);
    setViewingExercise(exercise);
    setViewingExerciseIndex(exerciseIndex ?? null);
    // Set initial editing group from the workout category exercise if available
    if (exerciseIndex !== undefined && exerciseIndex !== null) {
      const ex = currentCategory.exercises[exerciseIndex];
      setEditingGroupId(ex?.groupId || exercise.group_id || '');
    } else {
      setEditingGroupId(exercise.group_id || '');
    }
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setViewingExerciseGif(gifUrl);
    } catch {
      setViewingExerciseGif(null);
    }
  };

  // Handle group change from modal
  const handleModalGroupChange = (newGroupId: string) => {
    setEditingGroupId(newGroupId);
    if (viewingExerciseIndex !== null) {
      const newCategories = [...workoutCategories];
      const catIndex = newCategories.findIndex(c => c.id === selectedCategoryId);
      if (catIndex !== -1) {
        newCategories[catIndex].exercises[viewingExerciseIndex].groupId = newGroupId;
        setWorkoutCategories(newCategories);
      }
    }
  };

  const handleSave = async () => {
    console.log('[handleSave] Starting...');
    
    const hasName = workoutName.trim();
    const hasExercises = !workoutCategories.every(s => s.exercises.length === 0);
    
    if (!hasName && !hasExercises) {
      confirm('Inserisci nome scheda e gli esercizi');
      return;
    }
    if (!hasName) {
      confirm('Inserisci nome scheda');
      return;
    }
    if (!hasExercises) {
      confirm('Inserisci esercizi');
      return;
    }

    // Use the tracked original ID
    const workoutId = originalWorkoutIdRef.current || Date.now().toString();
    
    // Ensure createdAt is always a string
    let createdAt = editWorkout?.createdAt;
    if (!createdAt) {
      createdAt = new Date().toISOString();
    } else if (typeof createdAt !== 'string') {
      // If it's a Date object, convert to ISO string
      createdAt = new Date(createdAt).toISOString();
    }
    
    // Clean stations data - only keep needed properties and remove undefined values
    const cleanStations = workoutCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      exercises: (cat.exercises || []).map((ex: any) => {
        const cleanEx: any = {};
        // Only include defined values
        if (ex.exerciseId !== undefined) cleanEx.exerciseId = ex.exerciseId;
        if (ex.exerciseName !== undefined) cleanEx.exerciseName = ex.exerciseName;
        if (ex.groupId !== undefined) cleanEx.groupId = ex.groupId;
        if (ex.sets !== undefined) cleanEx.sets = ex.sets;
        if (ex.reps !== undefined) cleanEx.reps = ex.reps;
        if (ex.time !== undefined) cleanEx.time = ex.time;
        if (ex.rest !== undefined) cleanEx.rest = ex.rest;
        return cleanEx;
      })
    }));
    
    const workout = {
      id: workoutId,
      name: workoutName,
      stations: cleanStations,
      createdAt: createdAt
    };
    
    console.log('[handleSave] Saving workout with id:', workoutId, 'isEditing:', isEditing);
    console.log('[handleSave] workout:', JSON.stringify(workout, null, 2));

    try {
      if (isEditing) {
        console.log('[handleSave] Updating workout:', workoutId);
        await updateWorkout(workoutId, workout);
        console.log('[handleSave] Update complete');
      } else {
        console.log('[handleSave] Creating new workout');
        await createWorkout(workout);
        console.log('[handleSave] Create complete');
      }
      onSave(workout);
    } catch (error) {
      console.error('[handleSave] Error:', error);
      alert('Errore nel salvare: ' + (error as Error).message);
    }
  };

  // AI Auto-fill workout
  const handleAiAutoFill = async () => {
    if (exercises.length === 0 || groups.length === 0) {
      alert('Carica dati prima di usare AI');
      return;
    }

    setIsAiLoading(true);

    try {
      // Define the strength groups we need (6 exercises)
      const strengthGroups = ['chest', 'arms', 'back', 'core', 'shoulders', 'legs'];
      
      // Find group IDs by name
      const getGroupIdByName = (name: string) => {
        const group = groups.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
        return group?.id || null;
      };

      // Get exercises for a group
      const getGroupExercises = (groupId: string): Exercise[] => {
        return exercises.filter(e => e.group_id === groupId);
      };

      // Count muscles in a category
      const countMuscles = (exs: Exercise[]) => {
        const counts: Record<string, number> = {};
        exs.forEach(ex => {
          ex.muscles?.forEach((m: string) => {
            counts[m] = (counts[m] || 0) + 1;
          });
        });
        return counts;
      };

      // Check if adding exercise would cause red tag (count >= 4)
      const wouldBeRed = (currentCounts: Record<string, number>, exercise: Exercise): boolean => {
        for (const muscle of exercise.muscles || []) {
          if ((currentCounts[muscle] || 0) >= 3) return true; // Adding would make it 4+
        }
        return false;
      };

      // Pick a random exercise from a group that doesn't cause red
      const pickExercise = (
        groupId: string, 
        currentExs: Exercise[], 
        maxRetries: number = 20
      ): Exercise | null => {
        const groupExs = getGroupExercises(groupId);
        const currentCounts = countMuscles(currentExs);
        const usedIds = new Set(currentExs.map(e => e.id));
        
        for (let i = 0; i < maxRetries; i++) {
          const candidates = groupExs.filter(e => !usedIds.has(e.id));
          if (candidates.length === 0) break;
          
          const randomEx = candidates[Math.floor(Math.random() * candidates.length)];
          if (!wouldBeRed(currentCounts, randomEx)) {
            return randomEx;
          }
        }
        
        // If we couldn't find non-red, just return any random (fallback)
        const available = groupExs.filter(e => !usedIds.has(e.id));
        return available.length > 0 
          ? available[Math.floor(Math.random() * available.length)]
          : null;
      };

      // ======== FORZA ========
      const forzaExercises: Exercise[] = [];
      for (const groupName of strengthGroups) {
        const groupId = getGroupIdByName(groupName);
        if (groupId) {
          const picked = pickExercise(groupId, forzaExercises);
          if (picked) forzaExercises.push(picked);
        }
      }

      // ======== CARDIO ========
      // Find cardio group(s) - look for "cardio", "hiit", "aerobico"
      const cardioGroupId = getGroupIdByName('cardio') || getGroupIdByName('hiit') || getGroupIdByName('aerobico');
      let cardio1Exercises: Exercise[] = [];
      let cardio2Exercises: Exercise[] = [];

      if (cardioGroupId) {
        const cardioExs = getGroupExercises(cardioGroupId);
        const shuffled = [...cardioExs].sort(() => Math.random() - 0.5);
        
        // Cardio 1: first 2
        cardio1Exercises = shuffled.slice(0, 2);
        // Cardio 2: next 2 different ones
        cardio2Exercises = shuffled.slice(2, 4);
      }

      // Shuffle all exercises before adding to workout (final random order)
      const shuffledForza = [...forzaExercises].sort(() => Math.random() - 0.5);

      // Build the new workout categories
      const newCategories = [
        {
          id: 'forza',
          name: 'Forza',
          exercises: shuffledForza.map((ex, idx) => ({
            exerciseId: ex.id,
            exerciseName: ex.name,  // Store name for display
            groupId: ex.group_id,
            muscles: ex.muscles,
            reps: ex.reps || 10,
            sets: 3,
            rest: 60,
            difficulty: ex.difficulty || 'medium',
            gifUrl: getGifUrl(ex.id)
          }))
        },
        {
          id: 'cardio1',
          name: 'Cardio 1',
          exercises: cardio1Exercises.map((ex) => ({
            exerciseId: ex.id,
            exerciseName: ex.name,  // Store name for display
            groupId: ex.group_id,
            muscles: ex.muscles,
            time: 45,
            sets: 1,
            rest: 15,
            difficulty: ex.difficulty || 'medium',
            gifUrl: getGifUrl(ex.id)
          }))
        },
        {
          id: 'cardio2',
          name: 'Cardio 2',
          exercises: cardio2Exercises.map((ex) => ({
            exerciseId: ex.id,
            exerciseName: ex.name,  // Store name for display
            groupId: ex.group_id,
            muscles: ex.muscles,
            time: 45,
            sets: 1,
            rest: 15,
            difficulty: ex.difficulty || 'medium',
            gifUrl: getGifUrl(ex.id)
          }))
        }
      ];

      // Update state
      setWorkoutCategories(newCategories);
      setSelectedCategoryId('forza');
      setWorkoutName(workoutName || 'Scheda AI');

    } catch (error) {
      console.error('[handleAiAutoFill] Error:', error);
      alert('Errore nella generazione AI: ' + (error as Error).message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getExerciseById = (id: string) => exercises.find(e => e.id === id);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Sticky Header - dark black */}
      <div className="sticky top-0 z-40 bg-zinc-900 backdrop-blur-sm rounded-b-xl border-b-2 border-black/30 -mx-4 px-4 pb-2 space-y-2">
        {/* Title row */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleUnsavedChanges(onBack)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-bold text-white">
              {editWorkout ? 'Modifica Scheda' : 'Editor scheda'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAiAutoFill}
              disabled={isAiLoading}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              title="AI Auto-fill"
            >
              {isAiLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Wand className="w-5 h-5 text-purple-400" />
              )}
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
              onClick={() => handleUnsavedChanges(signOut)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        {/* Name + Save Button */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            id="workout-name"
            name="workoutName"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Nome della scheda"
            className="flex-1 px-4 py-3 bg-zinc-900 rounded-xl text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSave}
            className="w-[20%] py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors whitespace-nowrap"
          >
            Salva
          </button>
        </div>
        {/* Category Tabs */}
        <div className="flex gap-2">
          {WORKOUT_CATEGORIES.map((cat) => {
            const catData = workoutCategories.find(c => c.id === cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategoryId(cat.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`flex-1 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-600 text-white'
                    : catData?.exercises.length > 0
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      : 'bg-dark-bg text-gray-500'
                }`}
              >
                {cat.name} ({catData?.exercises.length || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Rest of content - scrolls under sticky header with tabs */}
      <div className="space-y-6 mt-3">
      {/* Hidden duplicate tabs - 2px invisible version to maintain layout */}
      <div className="flex gap-2 h-[2px]">
        {WORKOUT_CATEGORIES.map((cat) => {
          const catData = workoutCategories.find(c => c.id === cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex-1 rounded-lg text-sm font-semibold transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white'
                  : catData?.exercises.length > 0
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-dark-bg text-gray-500'
              }`}
              style={{ height: '2px', padding: 0 }}
            />
          );
        })}
      </div>

      {/* Current Category Exercises - sortable with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentCategory.exercises.map((_: any, i: number) => `${selectedCategoryId}-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {currentCategory.exercises.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nessun esercizio. Aggiungi dalla lista sotto.</p>
            ) : (
              currentCategory.exercises.map((ex: any, index: number) => (
                <SortableExerciseItem key={`${selectedCategoryId}-${index}`} ex={ex} index={index} />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Exercise Library - Groups collapsible */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Libreria Esercizi</h3>
        
        {/* Search Row */}
        <div className="flex items-center gap-2">
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
          <div className="text-sm text-zinc-400">
            Trovati {searchResults.reduce((acc, r) => acc + r.exerciseIds.length, 0)} ex
          </div>
        )}
        {isSearching && searchResults.length === 0 && searchQuery.trim() && (
          <div className="bg-zinc-900 rounded-xl px-5 py-8 text-center text-zinc-500">
            Nessun esercizio trovato per "{searchQuery}"
          </div>
        )}
        
        {/* When searching - show flat list - same style as ExerciseLibrary */}
        {isSearching && searchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            {exercises
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
                             exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddExercise(exercise, exercise.group_id)}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors ml-2"
                        title="Aggiungi"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        
        {/* When NOT searching - show expandable groups */}
        {!isSearching && (
          <div className="space-y-3">
            {groups.map(group => (
              <div key={group.id} className="bg-zinc-900 rounded-xl">
                {/* Group Header */}
                <button
                  id={`workout-group-header-${group.id}`}
                  onClick={() => toggleGroup(group.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-semibold border ${group.color_class}`}>
                      {group.label}
                    </span>
                    <span className="text-base text-zinc-400">
                      {getExercisesByGroup(group.id).length} ex
                    </span>
                  </div>
                  {expandedGroups.has(group.id) ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                {/* Exercises List - shown when expanded - same style as ExerciseLibrary */}
                {expandedGroups.has(group.id) && (
                  <div className="max-h-96 overflow-y-auto scrollbar-dark">
                    {getExercisesByGroup(group.id).length === 0 ? (
                      <div className="px-5 py-8 text-center text-zinc-500">
                        Nessun esercizio
                      </div>
                    ) : (
                      getExercisesByGroup(group.id).map(exercise => (
                        <div
                          key={exercise.id}
                          className="px-5 py-4 hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => handleViewExercise(exercise)}
                                  className="text-base font-medium text-white hover:text-blue-400 cursor-pointer transition-colors text-left flex items-center gap-2"
                                >
                                  {exercise.name}
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
                                   exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddExercise(exercise, group.id)}
                              className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors ml-2"
                              title="Aggiungi"
                            >
                              <Plus className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* View-Only Exercise Modal */}
      {viewingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => { setViewingExercise(null); setEditingExerciseInModal(false); }}>
          <div 
            className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - compact */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <h2 className="text-base font-semibold text-white">
                  {editingExerciseInModal ? 'Modifica Esercizio' : viewingExercise.name}
                </h2>
              </div>
              <button
                onClick={() => { setViewingExercise(null); setEditingExerciseInModal(false); }}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Content - scrollable, stacked vertically */}
            <div className="flex-1 overflow-y-auto">
              {/* GIF at top */}
              <div className="bg-zinc-900 flex items-center justify-center p-4 min-h-[180px]">
                {viewingExerciseGif ? (
                  <img 
                    src={viewingExerciseGif} 
                    alt={viewingExercise.name} 
                    className="max-w-full max-h-[200px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-zinc-500 text-center">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessuna immagine</p>
                  </div>
                )}
              </div>

              {/* Info below GIF - scrollable if needed */}
              <div className="p-4">
                {editingExerciseInModal ? (
                  /* Edit Form - compact layout */
                  <div className="space-y-3">
                    {/* Gruppo */}
                    <div>
                      <h3 className="text-xs font-medium text-zinc-400 mb-1">Gruppo</h3>
                      <select
                        value={editingGroupId || viewingExercise.group_id || ''}
                        onChange={(e) => {
                          setEditingGroupId(e.target.value);
                          if (viewingExerciseIndex !== null) {
                            const newCategories = [...workoutCategories];
                            const catIndex = newCategories.findIndex(c => c.id === selectedCategoryId);
                            if (catIndex !== -1) {
                              newCategories[catIndex].exercises[viewingExerciseIndex].groupId = e.target.value;
                              setWorkoutCategories(newCategories);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                      >
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Muscoli */}
                    <div>
                      <h3 className="text-xs font-medium text-zinc-400 mb-1">Muscoli</h3>
                      <div className="flex flex-wrap gap-1">
                        {viewingExercise.muscles?.map((muscle, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Tipo e Difficolta */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        viewingExercise.tipo === 'aerobico' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {viewingExercise.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        viewingExercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        viewingExercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {viewingExercise.difficulty === 'beginner' ? 'Principiante' :
                         viewingExercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                      </span>
                    </div>
                    {/* Descrizione */}
                    <div>
                      <h3 className="text-xs font-medium text-zinc-400 mb-1">Descrizione</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        {viewingExercise.description || 'Nessuna descrizione.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-3">
                    {/* Descrizione */}
                    <div>
                      <h3 className="text-xs font-medium text-zinc-400 mb-1">Descrizione</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        {viewingExercise.description || 'Nessuna descrizione disponibile.'}
                      </p>
                    </div>

                    {/* Muscoli */}
                    <div>
                      <h3 className="text-xs font-medium text-zinc-400 mb-1">Muscoli</h3>
                      <div className="flex flex-wrap gap-1">
                        {viewingExercise.muscles?.map((muscle, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-xs bg-white/20 text-white">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tipo e Difficolta */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        viewingExercise.tipo === 'aerobico' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {viewingExercise.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        viewingExercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        viewingExercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {viewingExercise.difficulty === 'beginner' ? 'Principiante' :
                         viewingExercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                      </span>
                    </div>

                    {/* Gruppo */}
                    <div>
                      <h3 className="text-xs font-medium text-zinc-400 mb-1">Gruppo</h3>
                      <p className="text-white text-sm font-medium">
                        {groups.find(g => g.id === (editingGroupId || viewingExercise.group_id))?.label || 'Nessun gruppo'}
                      </p>
                    </div>

                    {/* Modifica Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => { setViewingExercise(null); setEditingExerciseInModal(false); setFullEditModalExercise(viewingExercise); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Modifica
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Move Exercise Modal */}
      {moveExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setMoveExerciseModal(null)}>
          <div
            className="bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Sposta esercizio</h2>
              </div>
              <button
                onClick={() => setMoveExerciseModal(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-zinc-300 mb-4">Seleziona la tab dove vuoi spostare l'esercizio:</p>
              {workoutCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleMoveExercise(cat.id)}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    cat.id === moveExerciseModal.fromCategory
                      ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                  disabled={cat.id === moveExerciseModal.fromCategory}
                >
                  {cat.name}
                  {cat.id === moveExerciseModal.fromCategory && ' (corrente)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Modal - ExerciseDetailModal like in Library */}
      {fullEditModalExercise && (
        <ExerciseDetailModal
          exercise={fullEditModalExercise}
          gifUrl={viewingExerciseGif}
          mode="edit"
          groups={groups}
          onClose={() => {
            setFullEditModalExercise(null);
            setViewingExercise(null);
            setEditingExerciseInModal(false);
          }}
          onSave={async (exerciseData) => {
            // Update exercise in database 
            try {
              await updateExercise(fullEditModalExercise.id, {
                name: exerciseData.name,
                muscles: exerciseData.muscles,
                reps: exerciseData.reps,
                duration: exerciseData.duration,
                difficulty: exerciseData.difficulty,
                tipo: exerciseData.tipo,
                description: exerciseData.description,
              });

              // Update viewingExercise so read-only modal shows updated data
              setViewingExercise(prev => prev ? { ...prev, ...exerciseData } : null);
            } catch (err) {
              console.error('Error updating exercise:', err);
            }
            setFullEditModalExercise(null);
          }}
          onGifUpdated={async (exerciseId, newUrl) => {
            setViewingExerciseGif(newUrl);
          }}
        />
      )}

      {/* Duplicate Error Modal */}
      {duplicateError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setDuplicateError(null)}>
          <div
            className="bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Esercizio gia inserito</h2>
              </div>
              <button
                onClick={() => setDuplicateError(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-zinc-300 mb-2">L'esercizio <span className="text-white font-medium">{duplicateError}</span> e' gia presente in una delle tre tabelle.</p>
              <p className="text-zinc-500 text-sm">Rimuovi prima l'esercizio esistente per aggiungerlo a questa tabella.</p>
            </div>
            <div className="px-5 py-4 flex justify-end">
              <button
                onClick={() => setDuplicateError(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
