import { useState } from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exercises, muscleGroupLabels, MuscleGroup } from '../data/exercises';

const muscleGroups: MuscleGroup[] = ['upper-push', 'upper-pull', 'lower-body', 'core', 'plyometric', 'cardio'];

export function ExerciseLibrary() {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup>('upper-push');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercises
    .filter(e => e.muscleGroup === selectedGroup)
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-2">
            {muscleGroups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between ${
                  selectedGroup === group
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>{muscleGroupLabels[group]}</span>
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
                  {exercises.filter(e => e.muscleGroup === group).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-4">
            {muscleGroupLabels[selectedGroup]} Exercises
          </h3>
          <div className="grid gap-3">
            {filteredExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-lg">{exercise.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.muscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${difficultyColors[exercise.difficulty]}`}>
                      {exercise.difficulty}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {exercise.reps ? `${exercise.reps} reps` : exercise.duration ? `${exercise.duration}s` : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredExercises.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              No exercises found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
