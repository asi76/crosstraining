import { FolderOpen, Trash2, Play, Clock, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkout } from '../hooks/useWorkout';
import { Workout } from '../data/types';
import { muscleGroupLabels } from '../data/exercises';

export function SavedWorkouts() {
  const { savedWorkouts, loadWorkout, deleteWorkout } = useWorkout();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-3">
        <FolderOpen className="w-6 h-6 text-emerald-400" />
        Saved Workouts
        <span className="text-sm font-normal text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
          {savedWorkouts.length}
        </span>
      </h2>

      {savedWorkouts.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No Saved Workouts</h3>
          <p className="text-zinc-500">Create a workout and save it to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedWorkouts.map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-2">{workout.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-4 h-4" />
                      {workout.rounds} round{workout.rounds > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {workout.restBetweenStations}s rest
                    </span>
                    <span className="text-zinc-500">
                      {formatDate(workout.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {workout.stations.map((station, i) => (
                      <span
                        key={station.id}
                        className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                      >
                        {i + 1}. {station.exercise?.name || muscleGroupLabels[station.muscleGroup]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      loadWorkout(workout);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Load
                  </button>
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
