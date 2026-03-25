import { useState } from 'react';
import { Save, RotateCcw, Plus, Clock, Repeat, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkout } from '../hooks/useWorkout';
import { exercises, getExercisesByMuscleGroup, muscleGroupLabels, Exercise, MuscleGroup } from '../data/exercises';
import { Station } from '../data/types';

export function CreateWorkout() {
  const { currentWorkout, setCurrentWorkout, saveWorkout, resetWorkout } = useWorkout();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [expandedStation, setExpandedStation] = useState<string | null>(null);

  const updateStation = (stationId: string, updates: Partial<Station>) => {
    setCurrentWorkout({
      ...currentWorkout,
      stations: currentWorkout.stations.map(s =>
        s.id === stationId ? { ...s, ...updates } : s
      ),
    });
  };

  const selectExercise = (stationId: string, exercise: Exercise) => {
    const station = currentWorkout.stations.find(s => s.id === stationId);
    updateStation(stationId, {
      exercise: {
        ...exercise,
        reps: exercise.reps || 12,
        duration: exercise.duration || 30,
      },
    });
    setExpandedStation(null);
  };

  const handleSave = () => {
    saveWorkout(currentWorkout);
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Workout Name & Settings */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Workout Name</label>
            <input
              type="text"
              value={currentWorkout.name}
              onChange={(e) => setCurrentWorkout({ ...currentWorkout, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Repeat className="w-4 h-4 inline mr-1" />
                Rounds
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={currentWorkout.rounds}
                onChange={(e) => setCurrentWorkout({ ...currentWorkout, rounds: parseInt(e.target.value) || 1 })}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-medium focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Rest (sec)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={currentWorkout.restBetweenStations}
                onChange={(e) => setCurrentWorkout({ ...currentWorkout, restBetweenStations: parseInt(e.target.value) || 0 })}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-medium focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Round Rest
              </label>
              <input
                type="number"
                min={0}
                max={180}
                value={currentWorkout.restBetweenRounds}
                onChange={(e) => setCurrentWorkout({ ...currentWorkout, restBetweenRounds: parseInt(e.target.value) || 0 })}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-medium focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="bg-emerald-500 text-white text-sm w-6 h-6 rounded-full flex items-center justify-center">6</span>
          Workout Stations
        </h2>

        {currentWorkout.stations.map((station, index) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
          >
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedStation(expandedStation === station.id ? null : station.id)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-zinc-800 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-emerald-400">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-white">{muscleGroupLabels[station.muscleGroup]}</p>
                  <p className="text-sm text-zinc-400">
                    {station.exercise?.name || 'Select an exercise'}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${expandedStation === station.id ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {expandedStation === station.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-800"
                >
                  <div className="p-4 space-y-4">
                    {/* Exercise Selection */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Exercise</label>
                      <select
                        value={station.exercise?.id || ''}
                        onChange={(e) => {
                          const ex = exercises.find(x => x.id === e.target.value);
                          if (ex) selectExercise(station.id, ex);
                        }}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="">Select exercise...</option>
                        {getExercisesByMuscleGroup(station.muscleGroup).map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reps / Duration */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Reps</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={station.exercise?.reps || ''}
                          onChange={(e) => {
                            if (station.exercise) {
                              updateStation(station.id, {
                                exercise: { ...station.exercise, reps: parseInt(e.target.value) || undefined }
                              });
                            }
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="—"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Duration (sec)</label>
                        <input
                          type="number"
                          min={5}
                          max={300}
                          value={station.exercise?.duration || ''}
                          onChange={(e) => {
                            if (station.exercise) {
                              updateStation(station.id, {
                                exercise: { ...station.exercise, duration: parseInt(e.target.value) || undefined }
                              });
                            }
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="—"
                        />
                      </div>
                    </div>

                    {station.exercise && (
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-sm">
                        <p className="text-zinc-400">
                          Muscles: <span className="text-white">{station.exercise.muscles.join(', ')}</span>
                        </p>
                        <p className="text-zinc-400">
                          Difficulty: <span className={`font-medium ${
                            station.exercise.difficulty === 'beginner' ? 'text-green-400' :
                            station.exercise.difficulty === 'intermediate' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{station.exercise.difficulty}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={resetWorkout}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {showSaveConfirm ? 'Saved!' : 'Save Workout'}
        </button>
      </div>
    </div>
  );
}
