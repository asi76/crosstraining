import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getGroups, getExercises } from '../firebase';

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

interface ExercisesContextValue {
  groups: ExerciseGroup[];
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  refreshGroups: () => Promise<void>;
  refreshExercises: () => Promise<void>;
  getExercisesByGroup: (groupId: string) => Exercise[];
  getGroupById: (groupId: string) => ExerciseGroup | undefined;
}

const ExercisesContext = createContext<ExercisesContextValue | null>(null);

// Singleton cache - persists across component remounts
let cachedGroups: ExerciseGroup[] | null = null;
let cachedExercises: Exercise[] | null = null;

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<ExerciseGroup[]>(cachedGroups || []);
  const [exercises, setExercises] = useState<Exercise[]>(cachedExercises || []);
  const [loading, setLoading] = useState(!cachedGroups || !cachedExercises);
  const [error, setError] = useState<string | null>(null);

  const refreshGroups = useCallback(async () => {
    try {
      const data = await getGroups();
      if (data) {
        cachedGroups = data;
        setGroups(data);
      }
    } catch (err) {
      console.error('[useExercises] Error fetching groups:', err);
      setError('Failed to load groups');
    }
  }, []);

  const refreshExercises = useCallback(async () => {
    try {
      const data = await getExercises();
      if (data) {
        cachedExercises = data;
        setExercises(data);
      }
    } catch (err) {
      console.error('[useExercises] Error fetching exercises:', err);
      setError('Failed to load exercises');
    }
  }, []);

  // Initial load - only if not cached
  useEffect(() => {
    if (!cachedGroups && !cachedExercises) {
      setLoading(true);
      Promise.all([refreshGroups(), refreshExercises()])
        .finally(() => setLoading(false));
    }
  }, [refreshGroups, refreshExercises]);

  const getExercisesByGroup = useCallback((groupId: string): Exercise[] => {
    return exercises.filter(e => e.group_id === groupId);
  }, [exercises]);

  const getGroupById = useCallback((groupId: string): ExerciseGroup | undefined => {
    return groups.find(g => g.id === groupId);
  }, [groups]);

  return (
    <ExercisesContext.Provider value={{
      groups,
      exercises,
      loading,
      error,
      refreshGroups,
      refreshExercises,
      getExercisesByGroup,
      getGroupById
    }}>
      {children}
    </ExercisesContext.Provider>
  );
}

// Custom hook to use exercises context
export function useExercises(): ExercisesContextValue {
  const context = useContext(ExercisesContext);
  if (!context) {
    throw new Error('useExercises must be used within ExercisesProvider');
  }
  return context;
}

// Helper to get cached data without subscribing (for components that don't need re-renders)
export function getCachedExercises(): Exercise[] {
  return cachedExercises || [];
}

export function getCachedGroups(): ExerciseGroup[] {
  return cachedGroups || [];
}
