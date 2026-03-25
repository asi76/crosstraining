import { useState } from 'react';
import { Dumbbell, Library, Play, Save, FolderOpen, Trash2 } from 'lucide-react';
import { WorkoutProvider, useWorkout } from './hooks/useWorkout';
import { CreateWorkout } from './components/CreateWorkout';
import { WorkoutDisplay } from './components/WorkoutDisplay';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { SavedWorkouts } from './components/SavedWorkouts';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'create' | 'library' | 'saved';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('create');
  const [showWorkout, setShowWorkout] = useState(false);
  const { currentWorkout, resetWorkout } = useWorkout();

  if (showWorkout) {
    return <WorkoutDisplay onBack={() => setShowWorkout(false)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CrossTraining</h1>
                <p className="text-xs text-zinc-400">Circuit Workout Builder</p>
              </div>
            </div>
            <button
              onClick={() => setShowWorkout(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Workout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-zinc-900/50 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'create' as View, label: 'Create', icon: Dumbbell },
              { id: 'library' as View, label: 'Exercises', icon: Library },
              { id: 'saved' as View, label: 'Saved', icon: FolderOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                  currentView === id
                    ? 'text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {currentView === id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'create' && <CreateWorkout />}
            {currentView === 'library' && <ExerciseLibrary />}
            {currentView === 'saved' && <SavedWorkouts />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}
