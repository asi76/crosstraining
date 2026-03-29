import { useState, useCallback, useEffect } from 'react';
import { Workout, Station } from '../data/types';
import { getWorkout, createWorkout, updateWorkout, deleteWorkout as deleteWorkoutFromDb, subscribeToWorkouts } from '../firebase';

export const useWorkout = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);

  // Set up real-time listener for workouts - only reads once, then updates automatically
  useEffect(() => {
    console.log('[useWorkout] Setting up real-time listener');
    
    const unsubscribe = subscribeToWorkouts((workouts) => {
      console.log('[useWorkout] Received', workouts.length, 'workouts from listener');
      const mapped: Workout[] = workouts.map(w => ({
        id: w.id,
        name: w.name,
        stations: w.stations || [],
        createdAt: w.createdAt ? new Date(w.createdAt) : new Date()
      }));
      setSavedWorkouts(mapped);
    });

    return () => {
      console.log('[useWorkout] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  const loadSavedWorkouts = useCallback(async () => {
    // No longer needed - listener handles this automatically
    // Keeping for backwards compatibility
    console.log('[useWorkout] loadSavedWorkouts called (no-op, listener is active)');
  }, []);

  const saveWorkout = useCallback(async (workout: Workout) => {
    try {
      // Check if already exists
      const existing = await getWorkout(workout.id);
      
      const workoutData = {
        id: workout.id,
        name: workout.name,
        stations: workout.stations,
        createdAt: workout.createdAt instanceof Date 
          ? workout.createdAt.toISOString() 
          : workout.createdAt
      };
      
      if (!existing) {
        // Insert if doesn't exist
        await createWorkout(workoutData);
      } else {
        // Update if exists
        await updateWorkout(workout.id, {
          name: workout.name,
          stations: workout.stations
        });
      }
      
      // Note: No need to update local state - the listener will handle it
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    try {
      await deleteWorkoutFromDb(id);
      // Note: No need to update local state - the listener will handle it
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  }, []);

  const createNewWorkout = useCallback((stations: Station[]) => {
    const workout: Workout = {
      id: Date.now().toString(),
      name: 'New Workout',
      stations,
      createdAt: new Date()
    };
    setCurrentWorkout(workout);
    setCurrentStationIndex(0);
    return workout;
  }, []);

  const loadWorkout = useCallback((workout: Workout) => {
    setCurrentWorkout(workout);
    setCurrentStationIndex(0);
  }, []);

  const updateWorkoutName = useCallback((name: string) => {
    if (currentWorkout) {
      setCurrentWorkout({ ...currentWorkout, name });
    }
  }, [currentWorkout]);

  const goToStation = useCallback((index: number) => {
    if (currentWorkout && index >= 0 && index < currentWorkout.stations.length) {
      setCurrentStationIndex(index);
    }
  }, [currentWorkout]);

  const nextStation = useCallback(() => {
    if (currentWorkout && currentStationIndex < currentWorkout.stations.length - 1) {
      setCurrentStationIndex(prev => prev + 1);
    }
  }, [currentWorkout, currentStationIndex]);

  const prevStation = useCallback(() => {
    if (currentStationIndex > 0) {
      setCurrentStationIndex(prev => prev - 1);
    }
  }, [currentStationIndex]);

  return {
    currentWorkout,
    savedWorkouts,
    currentStationIndex,
    loadSavedWorkouts,
    saveWorkout,
    deleteWorkout,
    createNewWorkout,
    loadWorkout,
    updateWorkoutName,
    goToStation,
    nextStation,
    prevStation,
    setCurrentStationIndex
  };
};
