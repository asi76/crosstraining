import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkout } from '../hooks/useWorkout';
import { muscleGroupLabels } from '../data/exercises';
import { Workout } from '../data/types';

type Phase = 'exercise' | 'rest-station' | 'rest-round' | 'complete';

interface TimerState {
  phase: Phase;
  currentRound: number;
  currentStation: number;
  timeRemaining: number;
  isRunning: boolean;
  totalRounds: number;
}

export function WorkoutDisplay({ onBack }: { onBack: () => void }) {
  const { currentWorkout } = useWorkout();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [workout, setWorkout] = useState<Workout>(currentWorkout);
  const audioRef = useRef<AudioContext | null>(null);

  const getInitialState = (): TimerState => ({
    phase: 'exercise',
    currentRound: 1,
    currentStation: 0,
    timeRemaining: getExerciseTime(0),
    isRunning: false,
    totalRounds: workout.rounds,
  });

  const [state, setState] = useState<TimerState>(getInitialState);

  function getExerciseTime(stationIndex: number): number {
    const station = workout.stations[stationIndex];
    if (!station?.exercise) return 30;
    return station.exercise.duration || 30;
  }

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
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
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
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  const tick = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning) return prev;

      if (prev.timeRemaining <= 1) {
        playBeep();

        if (prev.phase === 'exercise') {
          const nextStation = prev.currentStation + 1;
          
          if (nextStation >= workout.stations.length) {
            // Completed all stations
            if (prev.currentRound >= prev.totalRounds) {
              // Workout complete
              playLongBeep();
              return { ...prev, phase: 'complete', timeRemaining: 0, isRunning: false };
            } else {
              // Start rest between rounds
              return {
                ...prev,
                phase: 'rest-round',
                timeRemaining: workout.restBetweenRounds,
              };
            }
          } else {
            // Rest between stations
            return {
              ...prev,
              phase: 'rest-station',
              timeRemaining: workout.restBetweenStations,
            };
          }
        } else if (prev.phase === 'rest-station') {
          // Start next station
          return {
            ...prev,
            phase: 'exercise',
            currentStation: prev.currentStation + 1,
            timeRemaining: getExerciseTime(prev.currentStation + 1),
          };
        } else if (prev.phase === 'rest-round') {
          // Start next round
          return {
            ...prev,
            phase: 'exercise',
            currentRound: prev.currentRound + 1,
            currentStation: 0,
            timeRemaining: getExerciseTime(0),
          };
        }
      }

      return { ...prev, timeRemaining: prev.timeRemaining - 1 };
    });
  }, [playBeep, playLongBeep, workout.stations.length, workout.restBetweenStations, workout.restBetweenRounds]);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const togglePause = () => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const reset = () => {
    setState(getInitialState());
  };

  const currentStation = workout.stations[state.currentStation];
  const progress = state.phase === 'exercise' 
    ? 1 - (state.timeRemaining / getExerciseTime(state.currentStation))
    : state.phase === 'rest-station' || state.phase === 'rest-round'
    ? 1 - (state.timeRemaining / (state.phase === 'rest-station' ? workout.restBetweenStations : workout.restBetweenRounds))
    : 1;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = () => {
    switch (state.phase) {
      case 'exercise':
        return currentStation?.exercise?.name || 'Exercise';
      case 'rest-station':
        return 'Rest';
      case 'rest-round':
        return 'Round Complete';
      case 'complete':
        return 'Workout Complete!';
    }
  };

  const getPhaseSublabel = () => {
    switch (state.phase) {
      case 'exercise':
        return `${muscleGroupLabels[currentStation?.muscleGroup || 'cardio']} • Station ${state.currentStation + 1}/6`;
      case 'rest-station':
        return `Next: ${workout.stations[state.currentStation + 1]?.exercise?.name || 'Exercise'}`;
      case 'rest-round':
        return `Round ${state.currentRound}/${state.totalRounds} Complete`;
      case 'complete':
        return 'Great job!';
    }
  };

  const getBackgroundColor = () => {
    switch (state.phase) {
      case 'exercise':
        return 'bg-emerald-500';
      case 'rest-station':
      case 'rest-round':
        return 'bg-yellow-500';
      case 'complete':
        return 'bg-emerald-600';
    }
  };

  if (state.phase === 'complete') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold text-white mb-4">Workout Complete!</h1>
          <p className="text-xl text-zinc-400 mb-8">
            You completed {workout.name} with {workout.rounds} rounds!
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Do Again
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              Back to Editor
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-white">{workout.name}</h1>
            <p className="text-xs text-zinc-400">Round {state.currentRound} of {workout.rounds}</p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Station Indicators */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between gap-2">
            {workout.stations.map((station, index) => {
              const isActive = index === state.currentStation && state.phase === 'exercise';
              const isComplete = index < state.currentStation || (index === state.currentStation && state.phase !== 'exercise' && state.phase !== 'complete');
              const isUpcoming = index > state.currentStation;
              
              return (
                <div
                  key={station.id}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-emerald-500' :
                    isComplete ? 'bg-emerald-500/50' :
                    'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl w-full">
          {/* Timer Circle */}
          <motion.div
            key={`${state.phase}-${state.timeRemaining}`}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="relative w-72 h-72 mx-auto mb-8"
          >
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="140"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-zinc-800"
              />
              <circle
                cx="144"
                cy="144"
                r="140"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={`${getBackgroundColor()} transition-colors duration-300`}
                strokeDasharray={2 * Math.PI * 140}
                strokeDashoffset={2 * Math.PI * 140 * (1 - progress)}
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-bold text-white tabular-nums">
                {formatTime(state.timeRemaining)}
              </span>
              <span className={`text-lg font-medium mt-2 ${state.phase === 'exercise' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {state.phase === 'rest-station' || state.phase === 'rest-round' ? 'REST' : ''}
              </span>
            </div>
          </motion.div>

          {/* Phase Info */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{getPhaseLabel()}</h2>
            <p className="text-lg text-zinc-400">{getPhaseSublabel()}</p>
          </div>

          {/* Exercise Info */}
          {state.phase === 'exercise' && currentStation?.exercise && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 mb-8"
            >
              <div className="flex justify-center gap-8 text-sm">
                {currentStation.exercise.reps && (
                  <div>
                    <span className="text-zinc-400">Reps</span>
                    <p className="text-2xl font-bold text-white">{currentStation.exercise.reps}</p>
                  </div>
                )}
                {currentStation.exercise.duration && (
                  <div>
                    <span className="text-zinc-400">Duration</span>
                    <p className="text-2xl font-bold text-white">{currentStation.exercise.duration}s</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={reset}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={togglePause}
              className={`p-6 rounded-full transition-colors ${state.isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {state.isRunning ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
