import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, GripVertical, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Exercise, MuscleGroup } from '../data/types';
import { supabase } from '../supabase';
import { ExerciseEditor } from './ExerciseEditor';
import { showNotification } from './NotificationModal';

const DEFAULT_GROUPS = [
  { id: 'upper-push' as MuscleGroup, name: 'upper-push', label: 'Upper Push', colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'upper-pull' as MuscleGroup, name: 'upper-pull', label: 'Upper Pull', colorClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'lower-body' as MuscleGroup, name: 'lower-body', label: 'Lower Body', colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'core' as MuscleGroup, name: 'core', label: 'Core', colorClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'plyometric' as MuscleGroup, name: 'plyometric', label: 'Plyometric', colorClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'cardio' as MuscleGroup, name: 'cardio', label: 'Cardio/HIIT', colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
];

export function ExerciseManager() {
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [exercises, setExercises] = useState<Record<string, Exercise[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Load groups
    const { data: groupsData } = await supabase
      .from('exercise_groups')
      .select('*')
      .order('sort_order');
    
    if (groupsData && groupsData.length > 0) {
      setGroups(groupsData.map(g => ({
        id: g.id as MuscleGroup,
        name: g.name,
        label: g.label,
        colorClass: g.color_class || ''
      })));
    }

    // Load exercises
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*');
    
    if (exercisesData) {
      const grouped: Record<string, Exercise[]> = {};
      exercisesData.forEach(ex => {
        if (!grouped[ex.group_id]) {
          grouped[ex.group_id] = [];
        }
        grouped[ex.group_id].push({
          id: ex.id,
          name: ex.name,
          muscles: ex.muscles || [],
          reps: ex.reps,
          duration: ex.duration,
          difficulty: ex.difficulty || 'intermediate',
        });
      });
      setExercises(grouped);
    }
    
    setLoading(false);
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleSaveExercise = async (exerciseData: Partial<Exercise> & { id: string }) => {
    // Save to Supabase
    const { error } = await supabase
      .from('exercises')
      .upsert({
        id: exerciseData.id,
        group_id: exerciseData.group_id,
        name: exerciseData.name,
        muscles: exerciseData.muscles,
        reps: exerciseData.reps,
        duration: exerciseData.duration,
        difficulty: exerciseData.difficulty,
      });

    if (error) {
      showNotification({
        type: 'alert',
        title: 'Errore',
        message: 'Errore nel salvare: ' + error.message,
      });
    } else {
      // Reload data
      await loadData();
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      showNotification({
        type: 'alert',
        title: 'Errore',
        message: 'Errore nell\'eliminare: ' + error.message,
      });
    } else {
      await loadData();
    }
  };

  const handleSaveNewGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const newId = newGroupName.toLowerCase().replace(/\s+/g, '-');
    const newGroup = {
      id: newId,
      name: newId,
      label: newGroupName.trim(),
      color_class: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      sort_order: groups.length + 1,
    };

    const { error } = await supabase
      .from('exercise_groups')
      .insert(newGroup);

    if (error) {
      showNotification({
        type: 'alert',
        title: 'Errore',
        message: 'Errore nel creare gruppo: ' + error.message,
      });
    } else {
      setNewGroupName('');
      setShowNewGroup(false);
      await loadData();
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Eliminare il gruppo e tutti i suoi esercizi?')) return;
    // Delete exercises first
    await supabase.from('exercises').delete().eq('group_id', groupId);
    
    // Delete group
    const { error } = await supabase
      .from('exercise_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      alert('Errore nell\'eliminare: ' + error.message);
    } else {
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-zinc-400">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gestione Esercizi</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewGroup(true)}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Gruppo
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Esercizio
          </button>
        </div>
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome del nuovo gruppo..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleSaveNewGroup}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Salva
            </button>
            <button
              onClick={() => { setShowNewGroup(false); setNewGroupName(''); }}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* Groups & Exercises */}
      <div className="space-y-3">
        {groups.map(group => (
          <div key={group.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-3 flex-1"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${group.colorClass}`}>
                  {group.label}
                </span>
                <span className="text-zinc-400 text-sm">
                  {exercises[group.id]?.length || 0} esercizi
                </span>
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                  title="Aggiungi esercizio"
                >
                  <Plus className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                  title="Elimina gruppo"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Exercises List */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-zinc-800">
                {exercises[group.id]?.length > 0 ? (
                  exercises[group.id].map(ex => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-zinc-600" />
                        <div>
                          <span className="text-white font-medium">{ex.name}</span>
                          <div className="flex gap-2 mt-0.5">
                            {ex.muscles.map(m => (
                              <span key={m} className="text-xs text-zinc-500">{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          ex.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          ex.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {ex.difficulty}
                        </span>
                        <button
                          onClick={() => setEditingExercise(ex)}
                          className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(ex.id)}
                          className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                    Nessun esercizio in questo gruppo
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingExercise) && (
        <ExerciseEditor
          exercise={editingExercise || undefined}
          groupId={editingExercise?.muscles[0] as MuscleGroup || groups[0]?.id || 'upper-push'}
          groups={groups.map(g => ({ id: g.id, label: g.label }))}
          onSave={handleSaveExercise}
          onDelete={editingExercise ? handleDeleteExercise : undefined}
          onClose={() => { setIsCreating(false); setEditingExercise(null); }}
        />
      )}
    </div>
  );
}
