import { Exercise, MuscleGroup } from './exercises';

export interface StationExercise extends Exercise {
  reps?: number;
  duration?: number;
}

export interface Station {
  id: string;
  muscleGroup: MuscleGroup;
  exercise?: StationExercise;
}

export interface Workout {
  id: string;
  name: string;
  stations: Station[];
  restBetweenStations: number;
  rounds: number;
  restBetweenRounds: number;
  createdAt: string;
}

export const createDefaultWorkout = (): Workout => ({
  id: crypto.randomUUID(),
  name: 'My Workout',
  stations: [
    { id: 'station-1', muscleGroup: 'upper-push' },
    { id: 'station-2', muscleGroup: 'upper-pull' },
    { id: 'station-3', muscleGroup: 'lower-body' },
    { id: 'station-4', muscleGroup: 'core' },
    { id: 'station-5', muscleGroup: 'plyometric' },
    { id: 'station-6', muscleGroup: 'cardio' },
  ],
  restBetweenStations: 30,
  rounds: 3,
  restBetweenRounds: 60,
  createdAt: new Date().toISOString(),
});
