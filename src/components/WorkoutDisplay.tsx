import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward,
  Volume2,
  VolumeX,
  Dumbbell,
  X,
  Check
} from 'lucide-react';
import { Workout } from '../data/types';
import { getExerciseById } from '../data/exercises';

interface WorkoutDisplayProps {
  workout: Workout;
  onComplete: () => void;
  onExit: () => void;
}

interface TimerState {
  stationIndex: number;
  exerciseIndex: number;
  setIndex: number;
  phase: 'work' | 'rest' | 'complete';
  seconds: number;
  isRunning: boolean;
}

export const WorkoutDisplay = ({ workout, onComplete, onExit }: WorkoutDisplayProps) => {
  const [timer, setTimer] = useState<TimerState>({
    stationIndex: 0,
    exerciseIndex: 0,
    setIndex: 0,
    phase: 'work',
    seconds: 0,
    isRunning: false
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);

  const getCurrentStation = () => workout.stations[timer.stationIndex];
  const getCurrentExercise = () => {
    const station = getCurrentStation();
    return station?.exercises[timer.exerciseIndex];
  };

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  const playLongBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  useEffect(() => {
    let interval: number | null = null;
    
    if (timer.isRunning && timer.phase !== 'complete') {
      interval = window.setInterval(() => {
        setTimer(prev => {
          if (prev.seconds <= 1) {
            playBeep();
            
            if (prev.phase === 'work') {
              const exercise = getCurrentExercise();
              const station = getCurrentStation();
              
              if (prev.setIndex < (exercise?.sets || 1) - 1) {
                return {
                  ...prev,
                  setIndex: prev.setIndex + 1,
                  seconds: exercise?.rest || 60,
                  phase: 'rest'
                };
              } else if (prev.exerciseIndex < station.exercises.length - 1) {
                return {
                  ...prev,
                  exerciseIndex: prev.exerciseIndex + 1,
                  setIndex: 0,
                  seconds: exercise?.rest || 60,
                  phase: 'rest'
                };
              } else if (prev.stationIndex < workout.stations.length - 1) {
                return {
                  ...prev,
                  stationIndex: prev.stationIndex + 1,
                  exerciseIndex: 0,
                  setIndex: 0,
                  seconds: 10,
                  phase: 'rest'
                };
              } else {
                playLongBeep();
                return { ...prev, phase: 'complete', isRunning: false };
              }
            } else {
              return { ...prev, seconds: 0, phase: 'work' };
            }
          }
          
          if (prev.seconds <= 4 && prev.phase === 'work') {
            playBeep();
          }
          
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.phase, soundEnabled, workout.stations, playBeep, playLongBeep]);

  const startWorkout = () => {
    const exercise = getCurrentExercise();
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      seconds: exercise?.reps || 10,
      phase: 'work'
    }));
  };

  const togglePause = () => {
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetExercise = () => {
    const exercise = getCurrentExercise();
    setTimer(prev => ({
      ...prev,
      setIndex: 0,
      seconds: exercise?.reps || 10,
      phase: 'work',
      isRunning: false
    }));
  };

  const goToStation = (index: number) => {
    if (index < 0 || index >= workout.stations.length) return;
    setTimer(prev => ({
      ...prev,
      stationIndex: index,
      exerciseIndex: 0,
      setIndex: 0,
      phase: 'work',
      isRunning: false
    }));
  };

  const exercise = getCurrentExercise();
  const station = getCurrentStation();
  const exerciseData = exercise ? getExerciseById(exercise.exerciseId) : null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const getTotalSets = () => {
    return station?.exercises.reduce((acc, ex) => acc + ex.sets, 0) || 0;
  };

  const getCompletedSets = () => {
    let completed = 0;
    for (let i = 0; i < timer.exerciseIndex; i++) {
      completed += station?.exercises[i]?.sets || 0;
    }
    return completed + timer.setIndex;
  };

  if (timer.phase === 'complete') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout Complete!</h1>
          <p className="text-gray-400 mb-8">Great job finishing {workout.name}</p>
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onExit}
            className="p-2 hover:bg-dark-hover rounded-lg text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium text-white truncate">{workout.name}</h1>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-dark-hover rounded-lg"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-gray-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {workout.stations.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStation(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                timer.stationIndex === idx
                  ? 'bg-blue-500 text-white'
                  : idx < timer.stationIndex
                  ? 'bg-green-500/50 text-white'
                  : 'bg-dark-card text-gray-400'
              }`}
            >
              {s.name.replace('Station ', '')}
            </button>
          ))}
        </div>

        <motion.div
          key={`${timer.stationIndex}-${timer.exerciseIndex}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6"
        >
          <div className="text-center mb-6">
            <p className="text-blue-500 text-sm font-medium mb-1">{station?.name}</p>
            <h2 className="text-2xl font-bold text-white mb-2">{exerciseData?.name}</h2>
            <p className="text-gray-400 text-sm">{exerciseData?.description}</p>
          </div>

          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#2a2a2a"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke={timer.phase === 'rest' ? '#f59e0b' : '#3b82f6'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - (timer.seconds / (timer.phase === 'rest' ? (exercise?.rest || 60) : (exercise?.reps || 10))))}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${timer.phase === 'rest' ? 'text-amber-500' : 'text-white'}`}>
                {timer.phase === 'rest' ? 'REST' : formatTime(timer.seconds)}
              </span>
              <span className="text-gray-500 text-sm">
                Set {timer.setIndex + 1} of {exercise?.sets || 1}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={resetExercise}
              className="p-3 bg-dark-hover rounded-full hover:bg-dark-border"
            >
              <RotateCcw className="w-6 h-6 text-gray-400" />
            </button>
            <button
              onClick={togglePause}
              className="p-6 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
            >
              {timer.isRunning ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
            <button
              onClick={() => goToStation(timer.stationIndex + 1)}
              disabled={timer.stationIndex >= workout.stations.length - 1}
              className="p-3 bg-dark-hover rounded-full hover:bg-dark-border disabled:opacity-30"
            >
              <SkipForward className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex justify-center gap-2">
            {Array.from({ length: getTotalSets() }).map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < getCompletedSets() ? 'bg-green-500' : 'bg-dark-hover'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {!timer.isRunning && timer.seconds === 0 && (
          <button
            onClick={startWorkout}
            className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Start
          </button>
        )}

        <div className="mt-6">
          <h3 className="text-gray-400 text-base mb-3">Up Next</h3>
          <div className="space-y-2">
            {station?.exercises.slice(timer.exerciseIndex + 1).map((ex) => {
              const exData = getExerciseById(ex.exerciseId);
              return (
                <div key={ex.exerciseId} className="flex items-center gap-3 text-gray-400">
                  <Dumbbell className="w-5 h-5" />
                  <span className="text-base font-medium">{exData?.name}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-base">{ex.sets} × {ex.reps}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
