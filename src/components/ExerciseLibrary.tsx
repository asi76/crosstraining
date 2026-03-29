import { useState } from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exercises, muscleGroupLabels, MuscleGroup } from '../data/exercises';

const muscleGroups: MuscleGroup[] = ['upper-push', 'upper-pull', 'lower-body', 'core', 'plyometric', 'cardio'];

export function ExerciseLibrary() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<MuscleGroup>('upper-push');
  const [expandedCategories, setExpandedCategories] = useState<Set<MuscleGroup>>(new Set(['upper-push']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (category: MuscleGroup) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredExercises = exercises
    .filter(e => e.muscleGroup === selectedCategoryId)
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

      {/* Category List with Expansion */}
      <div className="space-y-3">
        {muscleGroups.map((group) => {
          const isExpanded = expandedCategories.has(group);
          const isSelected = selectedCategoryId === group;
          const groupExercises = exercises
            .filter(e => e.muscleGroup === group)
            .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

          return (
            <div key={group} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Category Header - click to expand/collapse */}
              <button
                onClick={() => toggleCategory(group)}
                className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ChevronRight className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  <span className={`font-medium ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                    {muscleGroupLabels[group]}
                  </span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                    {groupExercises.length}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-zinc-800"
                  >
                    <div className="p-4 grid gap-3">
                      {groupExercises.length > 0 ? (
                        groupExercises.map((exercise, index) => (
                          <motion.div
                            key={exercise.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="bg-zinc-800/50 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-white">{exercise.name}</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {exercise.muscles.map((muscle) => (
                                    <span
                                      key={muscle}
                                      className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded"
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
                        ))
                      ) : (
                        <div className="text-center py-8 text-zinc-500">
                          No exercises found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
