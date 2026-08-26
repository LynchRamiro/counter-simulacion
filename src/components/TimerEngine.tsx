import React, { useState, useEffect, useRef } from 'react';
import { Play, SkipForward, CheckCircle2, XCircle, Layers, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { SimulationSystem, UserProfile, ProcessTimeRecord, SampleRecord } from '../types';
import { formatDuration, formatSecondsShort } from '../lib/formatters';

interface TimerEngineProps {
  systems: SimulationSystem[];
  selectedSystemId: string;
  onSelectSystemId: (id: string) => void;
  currentUser: UserProfile | null;
  onSaveRecord: (record: Omit<SampleRecord, 'id'>) => Promise<SampleRecord>;
  onNavigateToRecords: () => void;
}

export const TimerEngine: React.FC<TimerEngineProps> = ({
  systems,
  selectedSystemId,
  onSelectSystemId,
  currentUser,
  onSaveRecord,
  onNavigateToRecords,
}) => {
  // Active System
  const activeSystem = systems.find((s) => s.id === selectedSystemId) || systems[0];

  // Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [currentProcessIndex, setCurrentProcessIndex] = useState(0); // 0 to N-1
  const [completedProcessTimes, setCompletedProcessTimes] = useState<ProcessTimeRecord[]>([]);

  // Live Timer Counters (in seconds)
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [processElapsed, setProcessElapsed] = useState(0);

  // Success Feedback Toast
  const [lastSavedRecord, setLastSavedRecord] = useState<SampleRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // High Precision Timestamps
  const startTimeRef = useRef<number>(0);
  const processStartTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Synchronize when active system changes (if not running)
  useEffect(() => {
    if (!isRunning && activeSystem && (!selectedSystemId || selectedSystemId !== activeSystem.id)) {
      onSelectSystemId(activeSystem.id);
    }
  }, [activeSystem, isRunning, onSelectSystemId, selectedSystemId]);

  // Stopwatch Animation Frame Loop
  useEffect(() => {
    if (isRunning) {
      const updateTimers = () => {
        const now = performance.now();
        const totalSecs = (now - startTimeRef.current) / 1000;
        const procSecs = (now - processStartTimeRef.current) / 1000;

        setTotalElapsed(totalSecs);
        setProcessElapsed(procSecs);

        animFrameIdRef.current = requestAnimationFrame(updateTimers);
      };

      animFrameIdRef.current = requestAnimationFrame(updateTimers);
    } else {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isRunning]);

  if (!activeSystem) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No hay sistemas registrados</h3>
        <p className="text-sm text-slate-500 mt-1">
          Crea tu primer sistema de simulación y sus procesos en la pestaña "Sistemas".
        </p>
      </div>
    );
  }

  const processes = activeSystem.processes || [];
  const currentProcess = processes[currentProcessIndex] || {
    id: 'proc-default',
    order: 1,
    name: 'Proceso Principal',
  };
  const isLastProcess = currentProcessIndex === processes.length - 1;

  // 1. INICIAR MUESTRA
  const handleStart = () => {
    if (!currentUser) {
      alert('Por favor selecciona un usuario en la barra superior antes de comenzar.');
      return;
    }
    const now = performance.now();
    startTimeRef.current = now;
    processStartTimeRef.current = now;
    setCurrentProcessIndex(0);
    setCompletedProcessTimes([]);
    setTotalElapsed(0);
    setProcessElapsed(0);
    setLastSavedRecord(null);
    setIsRunning(true);
  };

  // 2. SIGUIENTE PROCESO
  const handleNextProcess = () => {
    if (!isRunning) return;

    const now = performance.now();
    const durationForCurrentProc = (now - processStartTimeRef.current) / 1000;

    const recordedItem: ProcessTimeRecord = {
      processId: currentProcess.id,
      processName: currentProcess.name,
      durationSeconds: Number(durationForCurrentProc.toFixed(2)),
    };

    const newCompleted = [...completedProcessTimes, recordedItem];
    setCompletedProcessTimes(newCompleted);

    // Advance to next process
    processStartTimeRef.current = now;
    setProcessElapsed(0);
    setCurrentProcessIndex((prev) => prev + 1);
  };

  // 3. FINALIZAR Y GUARDAR
  const handleFinishAndSave = async () => {
    if (!isRunning || !currentUser) return;

    const now = performance.now();
    const finalTotalSecs = (now - startTimeRef.current) / 1000;
    const finalProcSecs = (now - processStartTimeRef.current) / 1000;

    // Stop timer
    setIsRunning(false);
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    const lastProcRecord: ProcessTimeRecord = {
      processId: currentProcess.id,
      processName: currentProcess.name,
      durationSeconds: Number(finalProcSecs.toFixed(2)),
    };

    const allProcessTimes = [...completedProcessTimes, lastProcRecord];

    setIsSaving(true);
    try {
      const saved = await onSaveRecord({
        systemId: activeSystem.id,
        systemName: activeSystem.name,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
        processTimes: allProcessTimes,
        totalSystemTimeSeconds: Number(finalTotalSecs.toFixed(2)),
      });

      setLastSavedRecord(saved);
      // Reset timer UI for next run
      setCurrentProcessIndex(0);
      setCompletedProcessTimes([]);
      setTotalElapsed(0);
      setProcessElapsed(0);
    } catch (e) {
      console.error('Error saving record:', e);
      alert('Ocurrió un error al guardar la muestra.');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. DESCARTAR MUESTRA
  const handleDiscard = () => {
    setIsRunning(false);
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    setCurrentProcessIndex(0);
    setCompletedProcessTimes([]);
    setTotalElapsed(0);
    setProcessElapsed(0);
    setShowDiscardConfirm(false);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Top Selector & Active User Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sistema a Medir:
          </label>
          <select
            disabled={isRunning}
            value={activeSystem.id}
            onChange={(e) => onSelectSystemId(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-semibold rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {systems.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.name} ({sys.processes.length} procesos)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 shrink-0">
          <span>Operador:</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">
            {currentUser?.name || 'Sin seleccionar'}
          </span>
        </div>
      </div>

      {/* Main Stopwatch Area */}
      <div className="tech-card overflow-hidden shadow-sm">
        {/* Process Step Breadcrumbs */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center space-x-2 min-w-max">
            {processes.map((proc, index) => {
              const isCompleted = index < currentProcessIndex;
              const isCurrent = index === currentProcessIndex;
              return (
                <div key={proc.id} className="flex items-center space-x-2">
                  <div
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      isCurrent && isRunning
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className="font-bold">{index + 1}.</span>
                    <span>{proc.name}</span>
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </div>
                  {index < processes.length - 1 && <span className="text-slate-300 font-bold">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Big Digital Displays */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Current Process Display */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
              <span>Proceso Activo ({currentProcessIndex + 1}/{processes.length})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentProcess.name}
            </h2>

            {/* Big Process Digital Numbers */}
            <div className="timer-hero-box rounded-2xl p-6 max-w-md mx-auto my-3 active">
              <div className="font-mono-numbers text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
                {formatDuration(processElapsed)}
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Tiempo de este Proceso
              </div>
            </div>
          </div>

          {/* Total System Time Sub-Counter */}
          <div className="flex items-center justify-center space-x-3 bg-slate-100/80 rounded-xl p-3.5 border border-slate-200 max-w-md mx-auto">
            <Clock className="w-5 h-5 text-slate-500" />
            <div className="text-sm font-medium text-slate-600">Tiempo Total en Sistema:</div>
            <div className="font-mono-numbers text-xl font-bold text-slate-900">
              {formatDuration(totalElapsed)}
            </div>
          </div>

          {/* Interactive Action Controls */}
          <div className="pt-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={!currentUser}
                className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-lg sm:text-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>INICIAR MUESTRA</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Transition / Finish Button */}
                {!isLastProcess ? (
                  <button
                    onClick={handleNextProcess}
                    className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-lg sm:text-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                  >
                    <SkipForward className="w-6 h-6" />
                    <span>PASAR A: {processes[currentProcessIndex + 1]?.name}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFinishAndSave}
                    disabled={isSaving}
                    className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-lg sm:text-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>{isSaving ? 'GUARDANDO MUESTRA...' : 'FINALIZAR Y GUARDAR'}</span>
                  </button>
                )}

                {/* Cancel / Discard Sample Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(true)}
                    className="flex items-center space-x-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Descartar esta muestra</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current Measurement Partial Breakdown Table */}
          {isRunning && completedProcessTimes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tiempos Parciales Registrados en esta corrida:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {completedProcessTimes.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-700">{idx + 1}.</span>
                      <span className="text-slate-800 font-medium truncate max-w-[140px]">
                        {pt.processName}
                      </span>
                    </div>
                    <span className="font-mono-numbers font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {formatSecondsShort(pt.durationSeconds)} ({formatDuration(pt.durationSeconds)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Banner after saving */}
      {lastSavedRecord && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 sm:p-5 text-emerald-950 animate-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-base">
                  ¡Muestra registrada con éxito!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  ID: <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded">{lastSavedRecord.id}</code> — Total Sistema:{' '}
                  <span className="font-bold">{lastSavedRecord.totalSystemTimeSeconds.toFixed(2)}s</span> ({formatDuration(lastSavedRecord.totalSystemTimeSeconds)})
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lastSavedRecord.processTimes.map((pt, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white/80 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded"
                    >
                      {pt.processName}: <strong>{pt.durationSeconds.toFixed(2)}s</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToRecords}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-200/70 hover:bg-emerald-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              Ver en Tabla →
            </button>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">¿Descartar medición?</h3>
            </div>
            <p className="text-sm text-slate-600">
              Se cancelará la toma de tiempos actual y no se guardará en los registros.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Continuar midiendo
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Sí, descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
