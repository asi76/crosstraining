import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  Plus, 
  Library, 
  Save, 
  LogOut, 
  Shield,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Target,
  Trash2,
  RefreshCw,
  Copy
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useWorkout } from './hooks/useWorkout';
import { ExercisesProvider, useExercises } from './hooks/useExercises';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { CreateWorkout } from './components/CreateWorkout';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutDisplay } from './components/WorkoutDisplay';
import { NotificationModal } from './components/NotificationModal';
import { Workout } from './data/types';
import { createWorkout } from './firebase';
import { getGifUrl } from './data/gifMapping';

type View = 'home' | 'create' | 'library' | 'workout' | 'admin';

const WORKOUT_CATEGORIES = [
  { id: 'forza', name: 'Forza' },
  { id: 'cardio1', name: 'Cardio 1' },
  { id: 'cardio2', name: 'Cardio 2' }
];

function App() {
  const { user, role, loading, signOut } = useAuth();
  const {
    savedWorkouts,
    loadSavedWorkouts,
    saveWorkout,
    deleteWorkout,
    duplicateWorkout
  } = useWorkout();
  const { exercises: allExercises } = useExercises();
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lastView') as View) || 'home';
    }
    return 'home';
  });
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('forza');
  const [viewingExercise, setViewingExercise] = useState<any>(null);
  const [viewingExerciseData, setViewingExerciseData] = useState<any>(null);
  const [viewingExerciseGif, setViewingExerciseGif] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (role === 'enabled' || role === 'admin') {
      loadSavedWorkouts();
    }
  }, [role, loadSavedWorkouts]);

  // Persist current view to localStorage
  useEffect(() => {
    localStorage.setItem('lastView', currentView);
    // Scroll to top when view changes to home
    if (currentView === 'home') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentView]);

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setCurrentView('workout');
  };

  const handleWorkoutComplete = () => {
    setActiveWorkout(null);
    setCurrentView('home');
  };

  const handleExitWorkout = () => {
    setActiveWorkout(null);
    setCurrentView('home');
  };

  const getExercisesByCategory = (workout: Workout, categoryId: string) => {
    const category = workout.stations.find((s: any) => s.id === categoryId);
    return category?.exercises || [];
  };

  // Count muscle occurrences across ALL categories in a workout
  const getMuscleCountForWorkout = (workout: Workout) => {
    const muscleCount: Record<string, number> = {};
    workout.stations.forEach((station: any) => {
      station.exercises?.forEach((ex: any) => {
        const data = getExerciseById(ex.exerciseId);
        data?.muscles?.forEach((m: string) => {
          muscleCount[m] = (muscleCount[m] || 0) + 1;
        });
      });
    });
    return muscleCount;
  };

  const getMuscleColor = (muscle: string, muscleCount: Record<string, number>) => {
    const count = muscleCount[muscle] || 1;
    if (count >= 4) return 'bg-red-500/40 text-red-300 border border-red-500/50';
    if (count === 3) return 'bg-orange-500/40 text-orange-300 border border-orange-500/50';
    if (count === 2) return 'bg-yellow-500/40 text-yellow-300 border border-yellow-500/50';
    return 'bg-green-500/30 text-green-300 border border-green-500/40';
  };

  const getExerciseById = (id: string) => {
    return allExercises.find(e => e.id === id);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Dumbbell className="w-12 h-12 text-blue-400" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (role === 'pending') {
    return (
      <Login isPendingUser pendingEmail={user?.email || undefined} />
    );
  }

  if (currentView === 'admin') {
    return (
      <div>
        <AdminPanel />
        <button
          onClick={() => setCurrentView('home')}
          className="fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-dark-card rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <Dumbbell className="w-5 h-5" />
          Back to App
        </button>
      </div>
    );
  }

  if (currentView === 'workout' && activeWorkout) {
    return (
      <WorkoutDisplay 
        workout={activeWorkout} 
        onComplete={handleWorkoutComplete}
        onExit={handleExitWorkout}
      />
    );
  }

  if (currentView === 'create') {
    return (
      <CreateWorkout
        editWorkout={editingWorkout}
        onSave={(workout) => {
          // CreateWorkout already saved via updateWorkout/createWorkout
          // Just reset state here
          setEditingWorkout(null);
          setCurrentView('home');
        }}
        onStart={(workout) => {
          handleStartWorkout(workout);
        }}
        onBack={() => {
          setEditingWorkout(null);
          setCurrentView('home');
        }}
      />
    );
  }

  if (currentView === 'library') {
    return (
      <ExerciseLibrary onBack={() => setCurrentView('home')} />
    );
  }

  // Home view with inline expandable workout cards
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Sticky Header - dark black */}
      <div className="sticky top-0 z-40 bg-zinc-900 backdrop-blur-sm rounded-b-xl border-b-2 border-black/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-700 p-2 rounded-xl">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-[1.375rem] font-bold text-white">Crosstraining</h1>
                <p className="text-gray-400 text-xs">Benvenuto, {user.displayName?.split(' ')[0] || 'Atleta'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className="p-2 bg-zinc-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                  title="Admin Panel"
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => {
                  setExpandedWorkoutId(null);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="p-2 bg-zinc-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                title="Comprimi tutto"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'instant' }) || window.location.reload()}
                className="p-2 bg-zinc-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                title="Aggiorna Pagina"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={signOut}
                className="p-2 bg-zinc-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('create')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-left group flex items-center gap-4"
          >
            <div className="bg-blue-500/30 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Crea nuova scheda</h3>
              <p className="text-blue-200 text-sm">Pianifica una sessione di crosstraining</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('library')}
            className="bg-zinc-900 rounded-2xl p-5 text-left group hover:bg-zinc-800 transition-colors flex items-center gap-4"
          >
            <div className="bg-zinc-700 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-zinc-600 transition-colors">
              <Library className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Libreria Esercizi</h3>
              <p className="text-gray-400 text-sm">Consulta, aggiungi e modifica esercizi</p>
            </div>
          </motion.button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Save className="w-5 h-5 text-gray-400" />
            Schede Salvate ({savedWorkouts.length})
          </h2>
        </div>

        {savedWorkouts.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-8 text-center">
            <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Nessuna scheda salvata</p>
            <p className="text-gray-500 text-sm mb-4">Crea la tua prima scheda</p>
            <button
              onClick={() => setCurrentView('create')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Crea nuova scheda
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedWorkouts.map((workout, idx) => (
              <motion.div
                key={workout.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-zinc-900 rounded-xl overflow-hidden transition-colors ${
                  expandedWorkoutId === workout.id 
                    ? 'w-full' 
                    : ''
                }`}
              >
                {/* Workout Header - clickable to expand */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => {
                    if (expandedWorkoutId !== workout.id) {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }
                    setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {expandedWorkoutId === workout.id ? (
                      <ChevronUp className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{workout.name}</h3>
                      <span className="text-gray-500 text-sm">
                        {formatDate(workout.createdAt)} • {' '}
                        {workout.stations.reduce((acc, s) => acc + s.exercises.length, 0)} ex
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create a proper duplicated workout with new ID
                        const copy = {
                          ...JSON.parse(JSON.stringify(workout)),
                          id: 'workout-' + Date.now(),
                          name: workout.name + ' (copia)',
                          createdAt: new Date().toISOString()
                        };
                        // Save to Firebase database only
                        createWorkout(copy).then(() => {
                          alert('Copia creata e salvata! Ricarica la pagina.');
                        }).catch((error) => {
                          alert('Errore nel salvare la copia al database: ' + error.message);
                        });
                      }}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                      title="Duplica"
                    >
                      <Copy className="w-5 h-5 text-green-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Eliminare questo workout?')) {
                          deleteWorkout(workout.id);
                        }
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkout(workout);
                        setCurrentView('create');
                      }}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Pencil className="w-5 h-5 text-blue-400" />
                    </button>
                    {expandedWorkoutId === workout.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedWorkoutId(null);
                        }}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                        title="Chiudi"
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedWorkoutId === workout.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Category Tabs - same style as CreateWorkout */}
                      <div className="flex gap-2 p-4">
                        {WORKOUT_CATEGORIES.map((cat) => {
                          const exercises = getExercisesByCategory(workout, cat.id);
                          const isSelected = selectedCategoryId === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : exercises.length > 0
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    : 'bg-dark-bg text-gray-500'
                              }`}
                            >
                              {cat.name} ({exercises.length})
                            </button>
                          );
                        })}
                      </div>

                      {/* Exercise List - fixed height container, no dumbbell icon */}
                      <div className="p-4 min-h-[200px]">
                        {(() => {
                          const muscleCount = getMuscleCountForWorkout(workout);
                          return getExercisesByCategory(workout, selectedCategoryId).map((ex: any, index: number) => {
                            const exerciseData = getExerciseById(ex.exerciseId);
                            return (
                            <div 
                              key={index}
                              onClick={async () => {
                                setViewingExercise(ex);
                                setViewingExerciseData(exerciseData);
                                setViewingExerciseGif(null);
                                try {
                                  const gifUrl = await getGifUrl(ex.exerciseId);
                                  setViewingExerciseGif(gifUrl);
                                } catch {}
                              }}
                              className="bg-dark-bg rounded-lg p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors w-full mb-2 last:mb-0"
                            >
                              <div className="flex items-start justify-between w-full">
                                <div>
                                  <span className="text-white text-base font-medium block">
                                    {ex.exerciseName || ex.exerciseId}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {exerciseData?.muscles?.slice(0, 3).map((m: string, i: number) => (
                                      <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${getMuscleColor(m, muscleCount)}`}>{m}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    exerciseData?.tipo === 'aerobico' 
                                      ? 'bg-blue-500/20 text-blue-400' 
                                      : 'bg-orange-500/20 text-orange-400'
                                  }`}>
                                    {exerciseData?.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    exerciseData?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                    exerciseData?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {exerciseData?.difficulty === 'beginner' ? 'Principiante' :
                                     exerciseData?.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            );
                          });
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Info Modal - same style as CreateWorkout */}
      {viewingExercise && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setViewingExercise(null)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-white">
                  {viewingExercise.exerciseName || viewingExercise.exerciseId}
                </h2>
              </div>
              <button
                onClick={() => setViewingExercise(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="flex flex-col md:flex-row max-h-[calc(80vh-70px)]">
              <div className="md:w-1/2 bg-zinc-900 flex items-center justify-center p-4 min-h-[200px]">
                {viewingExerciseGif ? (
                  <img 
                    src={viewingExerciseGif} 
                    alt={viewingExercise.exerciseName} 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-zinc-500 text-center">
                    <Dumbbell className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessuna immagine</p>
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Descrizione</h3>
                    <p className="text-zinc-300 text-base leading-relaxed">
                      {viewingExerciseData?.description || 'Nessuna descrizione disponibile.'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Muscoli</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingExerciseData?.muscles?.map((muscle: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded text-sm bg-white/20 text-white border border-white/30">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-3 py-1 rounded ${
                      viewingExerciseData?.tipo === 'aerobico' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {viewingExerciseData?.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded ${
                      viewingExerciseData?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      viewingExerciseData?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {viewingExerciseData?.difficulty === 'beginner' ? 'Principiante' :
                       viewingExerciseData?.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <NotificationModal />
    </div>
  );
}

export default App;
