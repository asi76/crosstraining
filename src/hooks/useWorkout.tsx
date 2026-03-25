import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Workout, createDefaultWorkout } from '../data/types';

interface WorkoutContextType {
  currentWorkout: Workout;
  savedWorkouts: Workout[];
  setCurrentWorkout: (workout: Workout) => void;
  saveWorkout: (workout: Workout) => void;
  loadWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  resetWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

const STORAGE_KEY = 'crossstraining_workouts';

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentWorkout, setCurrentWorkout] = useState<Workout>(createDefaultWorkout());

  const saveWorkout = useCallback((workout: Workout) => {
    setSavedWorkouts(prev => {
      const existing = prev.findIndex(w => w.id === workout.id);
      const updated = existing >= 0 
        ? prev.map((w, i) => i === existing ? { ...workout, createdAt: w.createdAt } : w)
        : [...prev, workout];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadWorkout = useCallback((workout: Workout) => {
    setCurrentWorkout(workout);
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setSavedWorkouts(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetWorkout = useCallback(() => {
    setCurrentWorkout(createDefaultWorkout());
  }, []);

  return (
    <WorkoutContext.Provider value={{
      currentWorkout,
      savedWorkouts,
      setCurrentWorkout,
      saveWorkout,
      loadWorkout,
      deleteWorkout,
      resetWorkout,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
}
