import { Exercise, MuscleGroup } from './types';

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  'upper-push': 'Upper Body Push',
  'upper-pull': 'Upper Body Pull',
  'lower-body': 'Lower Body',
  'core': 'Core',
  'plyometric': 'Plyometric',
  'cardio': 'Cardio/HIIT',
};

export const muscleGroupColors: Record<MuscleGroup, string> = {
  'upper-push': 'text-red-400 bg-red-400/10 border-red-400/20',
  'upper-pull': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'lower-body': 'text-green-400 bg-green-400/10 border-green-400/20',
  'core': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'plyometric': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'cardio': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

export const exercises: Exercise[] = [
  // Upper Push (chest, shoulders, triceps)
  { id: 'up1', name: 'Push-Ups', muscleGroup: 'upper-push', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'beginner', reps: 15 },
  { id: 'up2', name: 'Diamond Push-Ups', muscleGroup: 'upper-push', muscles: ['Chest', 'Triceps'], difficulty: 'intermediate', reps: 12 },
  { id: 'up3', name: 'Pike Push-Ups', muscleGroup: 'upper-push', muscles: ['Shoulders', 'Triceps'], difficulty: 'intermediate', reps: 10 },
  { id: 'up4', name: 'Dumbbell Bench Press', muscleGroup: 'upper-push', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'intermediate', reps: 12 },
  { id: 'up5', name: 'Overhead Press', muscleGroup: 'upper-push', muscles: ['Shoulders', 'Triceps'], difficulty: 'intermediate', reps: 10 },
  { id: 'up6', name: 'Dips', muscleGroup: 'upper-push', muscles: ['Chest', 'Triceps', 'Shoulders'], difficulty: 'intermediate', reps: 12 },
  { id: 'up7', name: 'Decline Push-Ups', muscleGroup: 'upper-push', muscles: ['Upper Chest', 'Shoulders', 'Triceps'], difficulty: 'intermediate', reps: 12 },
  { id: 'up8', name: 'Close-Grip Bench Press', muscleGroup: 'upper-push', muscles: ['Triceps', 'Chest'], difficulty: 'advanced', reps: 10 },
  { id: 'up9', name: 'Arnold Press', muscleGroup: 'upper-push', muscles: ['Shoulders', 'Triceps'], difficulty: 'intermediate', reps: 10 },
  { id: 'up10', name: 'Cable Chest Fly', muscleGroup: 'upper-push', muscles: ['Chest'], difficulty: 'intermediate', reps: 12 },
  { id: 'up11', name: 'Wall Handstand Push-Ups', muscleGroup: 'upper-push', muscles: ['Shoulders', 'Triceps'], difficulty: 'advanced', reps: 8 },

  // Upper Pull (back, biceps)
  { id: 'upl1', name: 'Pull-Ups', muscleGroup: 'upper-pull', muscles: ['Lats', 'Biceps', 'Rear Delts'], difficulty: 'intermediate', reps: 8 },
  { id: 'upl2', name: 'Chin-Ups', muscleGroup: 'upper-pull', muscles: ['Biceps', 'Lats'], difficulty: 'intermediate', reps: 10 },
  { id: 'upl3', name: 'Bent Over Rows', muscleGroup: 'upper-pull', muscles: ['Back', 'Biceps'], difficulty: 'intermediate', reps: 12 },
  { id: 'upl4', name: 'Lat Pulldown', muscleGroup: 'upper-pull', muscles: ['Lats', 'Biceps'], difficulty: 'beginner', reps: 12 },
  { id: 'upl5', name: 'Face Pulls', muscleGroup: 'upper-pull', muscles: ['Rear Delts', 'Upper Back'], difficulty: 'beginner', reps: 15 },
  { id: 'upl6', name: 'Dumbbell Curls', muscleGroup: 'upper-pull', muscles: ['Biceps'], difficulty: 'beginner', reps: 12 },
  { id: 'upl7', name: 'Hammer Curls', muscleGroup: 'upper-pull', muscles: ['Biceps', 'Forearms'], difficulty: 'beginner', reps: 12 },
  { id: 'upl8', name: 'Deadlifts', muscleGroup: 'upper-pull', muscles: ['Back', 'Biceps', 'Glutes'], difficulty: 'intermediate', reps: 10 },
  { id: 'upl9', name: 'Seated Cable Row', muscleGroup: 'upper-pull', muscles: ['Back', 'Biceps'], difficulty: 'beginner', reps: 12 },
  { id: 'upl10', name: 'Inverted Rows', muscleGroup: 'upper-pull', muscles: ['Back', 'Biceps'], difficulty: 'intermediate', reps: 12 },
  { id: 'upl11', name: 'Preacher Curls', muscleGroup: 'upper-pull', muscles: ['Biceps'], difficulty: 'intermediate', reps: 10 },

  // Lower Body (legs, glutes)
  { id: 'lb1', name: 'Squats', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes', 'Hamstrings'], difficulty: 'beginner', reps: 15 },
  { id: 'lb2', name: 'Lunges', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes', 'Hamstrings'], difficulty: 'beginner', reps: 12 },
  { id: 'lb3', name: 'Romanian Deadlifts', muscleGroup: 'lower-body', muscles: ['Hamstrings', 'Glutes', 'Lower Back'], difficulty: 'intermediate', reps: 12 },
  { id: 'lb4', name: 'Leg Press', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes'], difficulty: 'beginner', reps: 12 },
  { id: 'lb5', name: 'Bulgarian Split Squats', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes'], difficulty: 'intermediate', reps: 10 },
  { id: 'lb6', name: 'Hip Thrusts', muscleGroup: 'lower-body', muscles: ['Glutes', 'Hamstrings'], difficulty: 'intermediate', reps: 15 },
  { id: 'lb7', name: 'Calf Raises', muscleGroup: 'lower-body', muscles: ['Calves'], difficulty: 'beginner', reps: 20 },
  { id: 'lb8', name: 'Goblet Squats', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes'], difficulty: 'beginner', reps: 12 },
  { id: 'lb9', name: 'Step-Ups', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes'], difficulty: 'beginner', reps: 12 },
  { id: 'lb10', name: 'Wall Sit', muscleGroup: 'lower-body', muscles: ['Quads', 'Glutes'], difficulty: 'beginner', duration: 45 },
  { id: 'lb11', name: 'Glute Bridges', muscleGroup: 'lower-body', muscles: ['Glutes', 'Hamstrings'], difficulty: 'beginner', reps: 15 },

  // Core (abs, obliques)
  { id: 'core1', name: 'Plank', muscleGroup: 'core', muscles: ['Abs', 'Obliques', 'Lower Back'], difficulty: 'beginner', duration: 45 },
  { id: 'core2', name: 'Crunches', muscleGroup: 'core', muscles: ['Abs'], difficulty: 'beginner', reps: 20 },
  { id: 'core3', name: 'Bicycle Crunches', muscleGroup: 'core', muscles: ['Abs', 'Obliques'], difficulty: 'beginner', reps: 20 },
  { id: 'core4', name: 'Leg Raises', muscleGroup: 'core', muscles: ['Lower Abs'], difficulty: 'intermediate', reps: 15 },
  { id: 'core5', name: 'Russian Twists', muscleGroup: 'core', muscles: ['Obliques', 'Abs'], difficulty: 'beginner', reps: 20 },
  { id: 'core6', name: 'Mountain Climbers', muscleGroup: 'core', muscles: ['Abs', 'Hip Flexors'], difficulty: 'intermediate', duration: 30 },
  { id: 'core7', name: 'Dead Bug', muscleGroup: 'core', muscles: ['Abs', 'Lower Back'], difficulty: 'beginner', reps: 12 },
  { id: 'core8', name: 'Side Plank', muscleGroup: 'core', muscles: ['Obliques', 'Abs'], difficulty: 'intermediate', duration: 30 },
  { id: 'core9', name: 'Ab Rollout', muscleGroup: 'core', muscles: ['Abs'], difficulty: 'intermediate', reps: 12 },
  { id: 'core10', name: 'V-Ups', muscleGroup: 'core', muscles: ['Abs', 'Hip Flexors'], difficulty: 'intermediate', reps: 15 },
  { id: 'core11', name: 'Flutter Kicks', muscleGroup: 'core', muscles: ['Lower Abs'], difficulty: 'intermediate', reps: 20 },

  // Plyometric (full body explosive)
  { id: 'ply1', name: 'Jump Squats', muscleGroup: 'plyometric', muscles: ['Quads', 'Glutes', 'Calves'], difficulty: 'intermediate', reps: 12 },
  { id: 'ply2', name: 'Burpees', muscleGroup: 'plyometric', muscles: ['Full Body'], difficulty: 'advanced', reps: 10 },
  { id: 'ply3', name: 'Box Jumps', muscleGroup: 'plyometric', muscles: ['Quads', 'Glutes', 'Calves'], difficulty: 'intermediate', reps: 10 },
  { id: 'ply4', name: 'Lateral Jumps', muscleGroup: 'plyometric', muscles: ['Glutes', 'Quads', 'Calves'], difficulty: 'intermediate', reps: 12 },
  { id: 'ply5', name: 'Jump Lunges', muscleGroup: 'plyometric', muscles: ['Quads', 'Glutes'], difficulty: 'intermediate', reps: 10 },
  { id: 'ply6', name: 'Tuck Jumps', muscleGroup: 'plyometric', muscles: ['Full Body'], difficulty: 'advanced', reps: 8 },
  { id: 'ply7', name: 'Squat Thrusts', muscleGroup: 'plyometric', muscles: ['Full Body'], difficulty: 'intermediate', reps: 12 },
  { id: 'ply8', name: 'Skater Jumps', muscleGroup: 'plyometric', muscles: ['Glutes', 'Quads', 'Balance'], difficulty: 'intermediate', reps: 12 },
  { id: 'ply9', name: 'Clap Push-Ups', muscleGroup: 'plyometric', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'advanced', reps: 8 },
  { id: 'ply10', name: 'Plyo Push-Ups', muscleGroup: 'plyometric', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'intermediate', reps: 10 },
  { id: 'ply11', name: 'Explosive Mountain Climbers', muscleGroup: 'plyometric', muscles: ['Abs', 'Hip Flexors', 'Cardio'], difficulty: 'advanced', duration: 30 },

  // Cardio/HIIT
  { id: 'card1', name: 'Jumping Jacks', muscleGroup: 'cardio', muscles: ['Full Body'], difficulty: 'beginner', duration: 45 },
  { id: 'card2', name: 'High Knees', muscleGroup: 'cardio', muscles: ['Hip Flexors', 'Quads', 'Cardio'], difficulty: 'beginner', duration: 30 },
  { id: 'card3', name: 'Butt Kicks', muscleGroup: 'cardio', muscles: ['Hamstrings', 'Cardio'], difficulty: 'beginner', duration: 30 },
  { id: 'card4', name: 'Sprint in Place', muscleGroup: 'cardio', muscles: ['Full Body', 'Cardio'], difficulty: 'intermediate', duration: 20 },
  { id: 'card5', name: 'Burpees (Cardio)', muscleGroup: 'cardio', muscles: ['Full Body'], difficulty: 'intermediate', reps: 10 },
  { id: 'card6', name: 'Mountain Climbers (Fast)', muscleGroup: 'cardio', muscles: ['Abs', 'Cardio'], difficulty: 'intermediate', duration: 30 },
  { id: 'card7', name: 'Jump Rope', muscleGroup: 'cardio', muscles: ['Calves', 'Cardio'], difficulty: 'intermediate', duration: 45 },
  { id: 'card8', name: 'Squat Jumps (Cardio)', muscleGroup: 'cardio', muscles: ['Quads', 'Glutes', 'Cardio'], difficulty: 'intermediate', reps: 15 },
  { id: 'card9', name: 'Shadow Boxing', muscleGroup: 'cardio', muscles: ['Arms', 'Core', 'Cardio'], difficulty: 'intermediate', duration: 45 },
  { id: 'card10', name: 'Fast Feet', muscleGroup: 'cardio', muscles: ['Legs', 'Cardio'], difficulty: 'beginner', duration: 30 },
  { id: 'card11', name: 'Plank Jacks', muscleGroup: 'cardio', muscles: ['Abs', 'Cardio'], difficulty: 'intermediate', duration: 30 },
];

export const getExercisesByMuscleGroup = (group: MuscleGroup): Exercise[] => {
  return exercises.filter(e => e.muscleGroup === group);
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find(e => e.id === id);
};
