import React, { useState } from 'react';
import { Plus, Trash2, Layers, ArrowUp, ArrowDown, Check, Settings2, Info } from 'lucide-react';
import { SimulationSystem } from '../types';

interface SystemManagerProps {
  systems: SimulationSystem[];
  onCreateSystem: (system: { name: string; description?: string; processes: { name: string; order: number }[] }) => Promise<void>;
  onDeleteSystem: (id: string) => Promise<void>;
  onSelectAndMeasure: (systemId: string) => void;
}

export const SystemManager: React.FC<SystemManagerProps> = ({
  systems,
  onCreateSystem,
  onDeleteSystem,
  onSelectAndMeasure,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [processInputs, setProcessInputs] = useState<string[]>([
    'Tiempo en Cola / Espera',
    'Tiempo de Atención / Servicio',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState<SimulationSystem | null>(null);

  const handleAddProcessField = () => {
    setProcessInputs((prev) => [...prev, `Proceso ${prev.length + 1}`]);
  };

  const handleRemoveProcessField = (index: number) => {
    if (processInputs.length <= 1) {
      alert('Un sistema debe tener al menos 1 proceso.');
      return;
    }
    setProcessInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProcessChange = (index: number, value: string) => {
    setProcessInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleMoveProcess = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === processInputs.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setProcessInputs((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el sistema.');
      return;
    }

    const validProcesses = processInputs
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((pName, idx) => ({
        name: pName,
        order: idx + 1,
      }));

    if (validProcesses.length === 0) {
      alert('Debes definir al menos un proceso válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateSystem({
        name: name.trim(),
        description: description.trim(),
        processes: validProcesses,
      });

      // Reset form
      setName('');
      setDescription('');
      setProcessInputs(['Tiempo en Cola / Espera', 'Tiempo de Atención / Servicio']);
      setIsCreating(false);
    } catch (e) {
      console.error('Error creating system:', e);
      alert('Error al crear el sistema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!systemToDelete) return;
    await onDeleteSystem(systemToDelete.id);
    setSystemToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings2 className="w-5 h-5 text-blue-600" />
            <span>Configuración de Sistemas y Procesos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define la estructura de colas y etapas de atención que tu equipo medirá en campo.
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Sistema</span>
          </button>
        )}
      </div>

      {/* Create New System Form Card */}
      {isCreating && (
        <div className="bg-white rounded-2xl border-2 border-blue-500/40 p-6 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
            <h3 className="font-bold text-slate-900 text-lg">Definir Nuevo Sistema</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1 rounded-md hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Nombre del Sistema *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Caja Rápida - Supermercado, Lavadero de Autos..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Medición de tiempos entre las 18:00 y 20:00 hs"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700"
                />
              </div>
            </div>

            {/* Processes Sequence List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Secuencia de Procesos / Etapas (en orden cronológico):
                </label>
                <button
                  type="button"
                  onClick={handleAddProcessField}
                  className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Etapa / Proceso</span>
                </button>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {processInputs.map((pName, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => handleProcessChange(index, e.target.value)}
                      placeholder={`Nombre del proceso ${index + 1}`}
                      className="flex-1 px-3 py-1.5 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded font-medium text-slate-800"
                    />

                    {/* Move up / down */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveProcess(index, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="Subir orden"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === processInputs.length - 1}
                        onClick={() => handleMoveProcess(index, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="Bajar orden"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete process button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveProcessField(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Eliminar este proceso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando...' : 'Guardar y Habilitar Sistema'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Systems List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((system) => (
          <div
            key={system.id}
            className="tech-card p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {system.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {system.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSystemToDelete(system)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar sistema"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Processes list badges */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Procesos ({system.processes.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {system.processes.map((proc, idx) => (
                    <span
                      key={proc.id}
                      className="inline-flex items-center space-x-1 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200"
                    >
                      <span className="font-bold text-blue-700">{idx + 1}.</span>
                      <span>{proc.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Measuring with this System button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Creado: {new Date(system.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => onSelectAndMeasure(system.id)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
              >
                Medir este Sistema →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info helper note */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>Consejo para Simulación:</strong> Configura los procesos en el orden exacto en que una entidad (cliente, producto o solicitud) atraviesa el sistema. Al tomar muestras, el cronómetro total acumula la suma de todas las etapas mientras que cada proceso se mide por separado.
        </div>
      </div>

      {/* Delete System Modal */}
      {systemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">¿Eliminar sistema?</h3>
            <p className="text-sm text-slate-600">
              ¿Seguro que deseas eliminar <strong>"{systemToDelete.name}"</strong>?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSystemToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
