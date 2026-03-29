import { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { Exercise, MuscleGroup } from '../data/types';
import { showNotification } from './NotificationModal';

interface ExerciseEditorProps {
  exercise?: Exercise; // If provided, editing existing; else creating new
  groupId: MuscleGroup;
  groups: { id: MuscleGroup; label: string }[];
  onSave: (exercise: Partial<Exercise> & { id: string }) => void;
  onDelete?: (exerciseId: string) => void;
  onClose: () => void;
}

export function ExerciseEditor({
  exercise,
  groupId,
  groups,
  onSave,
  onDelete,
  onClose,
}: ExerciseEditorProps) {
  const [name, setName] = useState(exercise?.name || '');
  const [muscles, setMuscles] = useState(exercise?.muscles.join(', ') || '');
  const [reps, setReps] = useState(exercise?.reps?.toString() || '');
  const [duration, setDuration] = useState(exercise?.duration?.toString() || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    exercise?.difficulty || 'intermediate'
  );
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup>(groupId);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setMuscles(exercise.muscles.join(', '));
      setReps(exercise.reps?.toString() || '');
      setDuration(exercise.duration?.toString() || '');
      setDifficulty(exercise.difficulty);
      setDescription('');
      setSelectedGroup(exercise.muscles[0] as MuscleGroup || groupId);
    }
  }, [exercise, groupId]);

  const handleSave = () => {
    if (!name.trim()) {
      showNotification({
        type: 'alert',
        title: 'Campo richiesto',
        message: 'Inserisci un nome per l\'esercizio',
      });
      return;
    }

    const musclesArray = muscles.split(',').map(m => m.trim()).filter(Boolean);
    
    const exerciseData: any = {
      id: exercise?.id || `ex_${Date.now()}`,
      name: name.trim(),
      muscles: musclesArray,
      reps: reps ? parseInt(reps) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      difficulty,
      group_id: selectedGroup,
    };

    onSave(exerciseData);
    onClose();
  };

  const handleDelete = () => {
    if (!exercise || !onDelete) return;
    if (confirm(`Eliminare "${exercise.name}"?`)) {
      onDelete(exercise.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div 
        className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {exercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-4">
          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Gruppo Muscolare</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as MuscleGroup)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nome Esercizio</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Push-Ups"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Muscles */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Muscoli (separati da virgola)</label>
            <input
              type="text"
              value={muscles}
              onChange={(e) => setMuscles(e.target.value)}
              placeholder="es. petto, spalle, tricipiti"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Reps / Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="es. 10"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Durata (sec)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="es. 30"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Difficoltà</label>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    difficulty === diff
                      ? diff === 'beginner' ? 'bg-green-500 text-white'
                        : diff === 'intermediate' ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {diff === 'beginner' ? 'Principiante' 
                   : diff === 'intermediate' ? 'Intermedio' 
                   : 'Avanzato'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          {exercise && onDelete ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Elimina
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
