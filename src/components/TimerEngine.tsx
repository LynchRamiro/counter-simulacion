import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Sparkles,
  Ticket,
  Monitor,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Users,
  ArrowRight,
  UserPlus,
  X
} from 'lucide-react';
import {
  UserProfile,
  SampleRecord,
  QueueType,
  OperationType,
  QueueClientItem,
  ServerStopwatch
} from '../types';
import { formatDuration } from '../lib/formatters';

interface TimerEngineProps {
  currentUser: UserProfile | null;
  onSaveRecord: (record: Omit<SampleRecord, 'id'>) => Promise<SampleRecord>;
  onNavigateToRecords: () => void;
  recentRecords: SampleRecord[];
}

export const TimerEngine: React.FC<TimerEngineProps> = ({
  currentUser,
  onSaveRecord,
  onNavigateToRecords,
  recentRecords,
}) => {
  // =========================================================================
  // 1. ESTADO DE COLAS FIFO (Clientes esperando en la fila)
  // =========================================================================
  const [totemQueue, setTotemQueue] = useState<QueueClientItem[]>([]);
  const [cajeroQueue, setCajeroQueue] = useState<QueueClientItem[]>([]);

  // Contadores correlativos para identificar a los clientes en cola (Cliente #1, #2, etc.)
  const totemCounterRef = useRef<number>(1);
  const cajeroCounterRef = useRef<number>(1);

  // =========================================================================
  // 2. ESTADO DE SERVIDORES DE ATENCIÓN
  // =========================================================================
  // Servidor Tótem (Autoservicio)
  const [totemServer, setTotemServer] = useState<ServerStopwatch>({
    serverId: 'totem',
    serverName: 'Tótem Autoservicio',
    queueType: 'totem',
    queueWaitTimeSeconds: 0,
    operationType: 'retiro_web',
    startTime: 0,
    accumulatedMs: 0,
    isRunning: false,
  });

  // Servidor Cajero 1 (Atención personalizada)
  const [cajero1, setCajero1] = useState<ServerStopwatch>({
    serverId: 'cajero-1',
    serverName: 'Cajero 1',
    queueType: 'personalizada',
    queueWaitTimeSeconds: 0,
    operationType: 'adquisicion',
    startTime: 0,
    accumulatedMs: 0,
    isRunning: false,
  });

  // Servidor Cajero 2 (Atención personalizada)
  const [cajero2, setCajero2] = useState<ServerStopwatch>({
    serverId: 'cajero-2',
    serverName: 'Cajero 2',
    queueType: 'personalizada',
    queueWaitTimeSeconds: 0,
    operationType: 'adquisicion',
    startTime: 0,
    accumulatedMs: 0,
    isRunning: false,
  });

  // =========================================================================
  // 3. ANIMATION FRAME TICK LOOP (60fps suave para todos los cronómetros vivos)
  // =========================================================================
  const [, setTick] = useState(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Hay cronómetros corriendo si hay gente en colas O servidores atendiendo
  const isAnyTimerActive =
    totemQueue.length > 0 ||
    cajeroQueue.length > 0 ||
    totemServer.isRunning ||
    cajero1.isRunning ||
    cajero2.isRunning;

  useEffect(() => {
    if (isAnyTimerActive) {
      const loop = () => {
        setTick((prev) => (prev + 1) % 1000000);
        animFrameIdRef.current = requestAnimationFrame(loop);
      };
      animFrameIdRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    }

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isAnyTimerActive]);

  // Toast y confirmaciones
  const [lastSavedRecord, setLastSavedRecord] = useState<SampleRecord | null>(null);
  const [savingServerId, setSavingServerId] = useState<string | null>(null);
  const [serverToDiscard, setServerToDiscard] = useState<ServerStopwatch | null>(null);

  // Helper: cálculo del tiempo de espera de un cliente en cola
  const getQueueWaitSeconds = (item: QueueClientItem): number => {
    return Math.max(0, (performance.now() - item.arrivalTime) / 1000);
  };

  // Helper: cálculo del tiempo de atención de un servidor
  const getServerElapsedSeconds = (server: ServerStopwatch): number => {
    let totalMs = server.accumulatedMs;
    if (server.isRunning && server.startTime > 0) {
      totalMs += performance.now() - server.startTime;
    }
    return Math.max(0, totalMs / 1000);
  };

  // =========================================================================
  // 4. ACCIONES DE COLA FIFO (Llegadas)
  // =========================================================================
  const handleClientArrival = (queueType: QueueType) => {
    if (!currentUser) {
      alert('Por favor selecciona un operador en la barra superior antes de comenzar.');
      return;
    }

    const now = performance.now();
    if (queueType === 'totem') {
      const num = totemCounterRef.current++;
      const newItem: QueueClientItem = {
        id: `totem-q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        clientNumber: num,
        queueType: 'totem',
        arrivalTime: now,
        arrivalDateIso: new Date().toISOString(),
      };
      setTotemQueue((prev) => [...prev, newItem]);
    } else {
      const num = cajeroCounterRef.current++;
      const newItem: QueueClientItem = {
        id: `cajero-q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        clientNumber: num,
        queueType: 'personalizada',
        arrivalTime: now,
        arrivalDateIso: new Date().toISOString(),
      };
      setCajeroQueue((prev) => [...prev, newItem]);
    }
  };

  // Abandono de cola (descartar cliente que desistió de esperar)
  const handleRemoveFromQueue = (queueType: QueueType, itemId: string) => {
    if (queueType === 'totem') {
      setTotemQueue((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCajeroQueue((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  // =========================================================================
  // 5. PASO DE COLA A SERVIDOR (FIFO Transition)
  // =========================================================================
  // Pasar cliente de Cola Tótem al Tótem de Autoservicio
  const handleMoveToTotem = (item?: QueueClientItem) => {
    if (!currentUser) {
      alert('Por favor selecciona un operador.');
      return;
    }
    if (totemServer.isRunning || getServerElapsedSeconds(totemServer) > 0) {
      alert('El Tótem se encuentra actualmente ocupado.');
      return;
    }

    const clientToMove = item || totemQueue[0];
    if (!clientToMove) {
      // Atención directa sin cola previa
      setTotemServer({
        serverId: 'totem',
        serverName: 'Tótem Autoservicio',
        queueType: 'totem',
        clientNumber: totemCounterRef.current++,
        queueWaitTimeSeconds: 0,
        operationType: 'retiro_web',
        startTime: performance.now(),
        accumulatedMs: 0,
        isRunning: true,
      });
      return;
    }

    const waitSeconds = getQueueWaitSeconds(clientToMove);
    setTotemQueue((prev) => prev.filter((i) => i.id !== clientToMove.id));

    setTotemServer({
      serverId: 'totem',
      serverName: 'Tótem Autoservicio',
      queueType: 'totem',
      clientNumber: clientToMove.clientNumber,
      queueWaitTimeSeconds: Number(waitSeconds.toFixed(2)),
      operationType: 'retiro_web',
      startTime: performance.now(),
      accumulatedMs: 0,
      isRunning: true,
    });
  };

  // Pasar cliente de Cola Cajero a Cajero 1 o Cajero 2
  const handleMoveToCajero = (targetCajero: 1 | 2, item?: QueueClientItem) => {
    if (!currentUser) {
      alert('Por favor selecciona un operador.');
      return;
    }

    const targetServer = targetCajero === 1 ? cajero1 : cajero2;
    if (targetServer.isRunning || getServerElapsedSeconds(targetServer) > 0) {
      alert(`El ${targetServer.serverName} se encuentra actualmente ocupado.`);
      return;
    }

    const clientToMove = item || cajeroQueue[0];
    const waitSeconds = clientToMove ? getQueueWaitSeconds(clientToMove) : 0;
    const clientNumber = clientToMove ? clientToMove.clientNumber : cajeroCounterRef.current++;

    if (clientToMove) {
      setCajeroQueue((prev) => prev.filter((i) => i.id !== clientToMove.id));
    }

    const newServerState: ServerStopwatch = {
      serverId: targetCajero === 1 ? 'cajero-1' : 'cajero-2',
      serverName: targetCajero === 1 ? 'Cajero 1' : 'Cajero 2',
      queueType: 'personalizada',
      clientNumber,
      queueWaitTimeSeconds: Number(waitSeconds.toFixed(2)),
      operationType: targetServer.operationType, // conserva opción elegida o default
      startTime: performance.now(),
      accumulatedMs: 0,
      isRunning: true,
    };

    if (targetCajero === 1) setCajero1(newServerState);
    else setCajero2(newServerState);
  };

  // Helper para asignar al primer cajero libre
  const handleAutoAssignCajero = () => {
    if (!cajero1.isRunning && getServerElapsedSeconds(cajero1) === 0) {
      handleMoveToCajero(1);
    } else if (!cajero2.isRunning && getServerElapsedSeconds(cajero2) === 0) {
      handleMoveToCajero(2);
    } else {
      alert('Ambos cajeros están ocupados en este momento.');
    }
  };

  // =========================================================================
  // 6. CONTROL DE CRONÓMETROS DE SERVIDOR (Pausa / Reanudar / Reset)
  // =========================================================================
  const togglePauseServer = (serverId: 'totem' | 'cajero-1' | 'cajero-2') => {
    const update = (s: ServerStopwatch): ServerStopwatch => {
      if (s.isRunning) {
        const currentElapsedMs = performance.now() - s.startTime;
        return {
          ...s,
          isRunning: false,
          startTime: 0,
          accumulatedMs: s.accumulatedMs + currentElapsedMs,
        };
      } else {
        return {
          ...s,
          isRunning: true,
          startTime: performance.now(),
        };
      }
    };

    if (serverId === 'totem') setTotemServer(update);
    else if (serverId === 'cajero-1') setCajero1(update);
    else if (serverId === 'cajero-2') setCajero2(update);
  };

  const handleResetServer = (serverId: 'totem' | 'cajero-1' | 'cajero-2') => {
    const reset = (s: ServerStopwatch): ServerStopwatch => ({
      ...s,
      isRunning: false,
      startTime: 0,
      accumulatedMs: 0,
      queueWaitTimeSeconds: 0,
      clientNumber: undefined,
      notes: '',
    });

    if (serverId === 'totem') setTotemServer(reset);
    else if (serverId === 'cajero-1') setCajero1(reset);
    else if (serverId === 'cajero-2') setCajero2(reset);
  };

  const setOperationType = (serverId: 'cajero-1' | 'cajero-2', op: OperationType) => {
    if (serverId === 'cajero-1') setCajero1((s) => ({ ...s, operationType: op }));
    else setCajero2((s) => ({ ...s, operationType: op }));
  };

  // =========================================================================
  // 7. FINALIZAR Y GUARDAR MUESTRA
  // =========================================================================
  const handleFinishAndSave = async (server: ServerStopwatch) => {
    if (!currentUser) {
      alert('Por favor selecciona tu operador.');
      return;
    }

    const serviceSeconds = Number(getServerElapsedSeconds(server).toFixed(2));
    if (serviceSeconds < 0.5) {
      alert('La atención es muy corta (menos de 0.5s).');
      return;
    }

    const queueWaitSeconds = server.queueWaitTimeSeconds;
    const totalSeconds = Number((queueWaitSeconds + serviceSeconds).toFixed(2));
    const isTotem = server.queueType === 'totem';

    setSavingServerId(server.serverId);
    try {
      const processName = isTotem
        ? 'Retiro de entradas (App Web)'
        : server.operationType === 'adquisicion'
        ? `Compra de entradas (${server.serverName})`
        : `Retiro de entradas App Web (${server.serverName})`;

      const saved = await onSaveRecord({
        systemId: isTotem ? 'cine-totem' : 'cine-personalizada',
        systemName: isTotem ? 'Tótem de Autoservicio' : 'Atención Personalizada',
        queueType: server.queueType,
        operationType: server.operationType,
        serverName: server.serverName,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
        queueWaitTimeSeconds: queueWaitSeconds,
        serviceTimeSeconds: serviceSeconds,
        totalSystemTimeSeconds: totalSeconds,
        processTimes: [
          {
            processId: isTotem ? 'proc-totem-cola' : 'proc-pers-cola',
            processName: 'Tiempo en Cola (Espera)',
            durationSeconds: queueWaitSeconds,
          },
          {
            processId: isTotem ? 'proc-totem-atencion' : `proc-pers-${server.operationType}`,
            processName,
            durationSeconds: serviceSeconds,
          },
        ],
        notes: server.notes?.trim() || '',
      });

      setLastSavedRecord(saved);

      // Reiniciar el servidor a estado Libre listo para el siguiente cliente
      handleResetServer(server.serverId as any);
    } catch (e) {
      console.error('Error al guardar muestra:', e);
      alert('Ocurrió un error al guardar la muestra.');
    } finally {
      setSavingServerId(null);
    }
  };

  const handleConfirmDiscard = () => {
    if (!serverToDiscard) return;
    handleResetServer(serverToDiscard.serverId as any);
    setServerToDiscard(null);
  };

  // =========================================================================
  // 8. MÉTRICAS RÁPIDAS DE SESIÓN
  // =========================================================================
  const totemRecords = recentRecords.filter((r) => r.queueType === 'totem' || r.systemName.toLowerCase().includes('totem'));
  const persRecords = recentRecords.filter((r) => r.queueType === 'personalizada' || !r.systemName.toLowerCase().includes('totem'));
  const persAdq = persRecords.filter((r) => r.operationType === 'adquisicion');
  const persRet = persRecords.filter((r) => r.operationType === 'retiro_web');

  const avgTotemCola = totemRecords.length > 0 ? totemRecords.reduce((acc, r) => acc + (r.queueWaitTimeSeconds || 0), 0) / totemRecords.length : 0;
  const avgTotemServ = totemRecords.length > 0 ? totemRecords.reduce((acc, r) => acc + (r.serviceTimeSeconds || r.totalSystemTimeSeconds), 0) / totemRecords.length : 0;

  const avgPersCola = persRecords.length > 0 ? persRecords.reduce((acc, r) => acc + (r.queueWaitTimeSeconds || 0), 0) / persRecords.length : 0;
  const avgPersAdqServ = persAdq.length > 0 ? persAdq.reduce((acc, r) => acc + (r.serviceTimeSeconds || r.totalSystemTimeSeconds), 0) / persAdq.length : 0;
  const avgPersRetServ = persRet.length > 0 ? persRet.reduce((acc, r) => acc + (r.serviceTimeSeconds || r.totalSystemTimeSeconds), 0) / persRet.length : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner / Operator Alert */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Toma de Tiempos Simultánea — Sistema de Cine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cronometra la <strong>espera en cola (FIFO)</strong> y el <strong>tiempo de atención</strong> simultáneamente en cada canal.
          </p>
        </div>

        {/* Current Operator Badge */}
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-500">Operador:</span>
          <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded shadow-2xs">
            {currentUser?.name || 'Sin seleccionar'}
          </span>
        </div>
      </div>

      {/* Success Notification Banner after saving */}
      {lastSavedRecord && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 text-emerald-950 animate-in slide-in-from-top-2 duration-300 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h4 className="font-extrabold text-emerald-900 text-sm sm:text-base">
                    ¡Muestra guardada con éxito!
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                    {lastSavedRecord.serverName || lastSavedRecord.systemName}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                    {lastSavedRecord.operationType === 'adquisicion' ? 'Compra' : 'Retiro Web'}
                  </span>
                </div>
                <div className="text-xs text-emerald-800 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Espera en Cola (Wq): <strong>{(lastSavedRecord.queueWaitTimeSeconds ?? 0).toFixed(2)}s</strong>
                  </span>
                  <span>
                    Atención (Ws): <strong>{(lastSavedRecord.serviceTimeSeconds ?? lastSavedRecord.totalSystemTimeSeconds).toFixed(2)}s</strong>
                  </span>
                  <span>
                    Total en Sistema (W): <strong className="font-mono text-emerald-950">{lastSavedRecord.totalSystemTimeSeconds.toFixed(2)}s</strong> ({formatDuration(lastSavedRecord.totalSystemTimeSeconds)})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToRecords}
              className="text-xs font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-200 hover:bg-emerald-300 px-3.5 py-2 rounded-xl shrink-0 transition-colors flex items-center space-x-1"
            >
              <span>Ver tabla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLOQUE 1: SISTEMA TÓTEM (Cola Tótem FIFO ➔ Autoservicio)                   */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border-2 border-indigo-200/80 shadow-sm overflow-hidden transition-all hover:border-indigo-300">
        {/* Block Header */}
        <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-700/80 border border-indigo-500/40 flex items-center justify-center text-white shadow-inner shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-indigo-500/40 text-indigo-100 px-2 py-0.5 rounded">
                  Canal 1
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Cola Tótem ➔ Autoservicio
                </h2>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Sólo retiro de entradas adquiridas por la app web. Cola FIFO y autoservicio.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="text-indigo-200">Muestras guardadas: <strong className="text-white font-mono">{totemRecords.length}</strong></span>
            <span className="text-indigo-200">
              Promedio Cola: <strong className="text-white font-mono">{avgTotemCola.toFixed(1)}s</strong> | Atención: <strong className="text-white font-mono">{avgTotemServ.toFixed(1)}s</strong>
            </span>
          </div>
        </div>

        {/* Interior Container: Cola Tótem (FIFO) + Servidor Autoservicio */}
        <div className="p-4 sm:p-6 bg-slate-50/50 space-y-5">
          {/* 1.1 SUB-SECCIÓN: COLA TÓTEM (FIFO) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Cola Tótem (FIFO)
                  </h3>
                  <span className="text-xs text-slate-500">
                    {totemQueue.length === 0 ? 'No hay personas esperando en la fila' : `${totemQueue.length} persona(s) esperando`}
                  </span>
                </div>
              </div>

              {/* Botón Llegada a Cola Tótem */}
              <button
                type="button"
                onClick={() => handleClientArrival('totem')}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Llegada a Cola Tótem</span>
              </button>
            </div>

            {/* Lista horizontal/cards de personas esperando en Cola Tótem */}
            {totemQueue.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                {totemQueue.map((item, idx) => {
                  const waitSecs = getQueueWaitSeconds(item);
                  const isFirstInLine = idx === 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isFirstInLine
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-slate-900">
                            Cliente #{item.clientNumber}
                          </span>
                          {isFirstInLine && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                              1° en fila
                            </span>
                          )}
                        </div>
                        <div className="font-mono-numbers text-sm font-bold text-indigo-900">
                          {formatDuration(waitSecs)} ({waitSecs.toFixed(1)}s)
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleMoveToTotem(item)}
                          disabled={totemServer.isRunning || getServerElapsedSeconds(totemServer) > 0}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold shadow-2xs transition-all flex items-center space-x-1"
                          title="Pasar este cliente a atención en Tótem"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Pasar a Tótem</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue('totem', item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Descartar (Abandono de fila)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1.2 SUB-SECCIÓN: SERVIDOR TÓTEM (AUTOSERVICIO) */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 transition-all shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    totemServer.isRunning ? 'bg-emerald-500 animate-ping' : getServerElapsedSeconds(totemServer) > 0 ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                />
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {totemServer.serverName}
                </span>
                {totemServer.clientNumber && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Cliente #{totemServer.clientNumber}
                  </span>
                )}
              </div>

              {/* Badge Espera en Cola previa */}
              <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                Espera en cola: <strong className="font-mono">{totemServer.queueWaitTimeSeconds.toFixed(1)}s</strong>
              </div>
            </div>

            {/* Digital Timer Display */}
            <div className="text-center py-2">
              <div className="timer-hero-box rounded-2xl p-4 sm:p-5 max-w-xs mx-auto">
                <div className="font-mono-numbers text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {formatDuration(getServerElapsedSeconds(totemServer))}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Tiempo de Autoservicio: {getServerElapsedSeconds(totemServer).toFixed(2)}s
                </div>
              </div>
            </div>

            {/* Botones de acción del Tótem */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center space-x-1">
                {/* Descartar */}
                {getServerElapsedSeconds(totemServer) > 0 && (
                  <button
                    type="button"
                    onClick={() => setServerToDiscard(totemServer)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Descartar esta atención"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {/* Reiniciar */}
                {getServerElapsedSeconds(totemServer) > 0 && !totemServer.isRunning && (
                  <button
                    type="button"
                    onClick={() => handleResetServer('totem')}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Reiniciar a cero"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 flex-wrap justify-end">
                {/* Si el servidor está libre y no ha iniciado */}
                {!totemServer.isRunning && getServerElapsedSeconds(totemServer) === 0 ? (
                  <>
                    <button
                      type="button"
                      disabled={totemQueue.length === 0}
                      onClick={() => handleMoveToTotem()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-1.5"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Atender Siguiente de Cola (FIFO)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveToTotem()}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                      title="Iniciar atención directa si el cliente no hizo cola"
                    >
                      Atención directa (sin espera)
                    </button>
                  </>
                ) : (
                  <>
                    {/* Pausa / Reanudar */}
                    <button
                      type="button"
                      onClick={() => togglePauseServer('totem')}
                      className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-1.5 text-white ${
                        totemServer.isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {totemServer.isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{totemServer.isRunning ? 'Pausar' : 'Reanudar'}</span>
                    </button>

                    {/* Finalizar y Guardar */}
                    <button
                      type="button"
                      disabled={getServerElapsedSeconds(totemServer) < 0.5 || savingServerId === 'totem'}
                      onClick={() => handleFinishAndSave(totemServer)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{savingServerId === 'totem' ? 'Guardando...' : 'Finalizar y Guardar'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOQUE 2: ATENCIÓN PERSONALIZADA (Cola Cajero FIFO ➔ 2 Cajeros)          */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border-2 border-emerald-300/80 shadow-sm overflow-hidden transition-all hover:border-emerald-400">
        {/* Block Header */}
        <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-emerald-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-white shadow-inner shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded">
                  Canal 2
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Cola Cajero ➔ Atención Personalizada (2 Cajeros)
                </h2>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Cola FIFO de clientes. Dos cajeros en simultáneo con indicador de Compra o Retiro Web.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="text-emerald-200">
              Espera Cola: <strong className="text-white font-mono">{avgPersCola.toFixed(1)}s</strong>
            </span>
            <span className="text-emerald-200">
              Atención Compra: <strong className="text-white font-mono">{avgPersAdqServ.toFixed(1)}s</strong> | Retiro: <strong className="text-white font-mono">{avgPersRetServ.toFixed(1)}s</strong>
            </span>
          </div>
        </div>

        {/* Interior Container: Cola Cajero (FIFO) + 2 Cajeros en Paralelo */}
        <div className="p-4 sm:p-6 bg-slate-50/50 space-y-5">
          {/* 2.1 SUB-SECCIÓN: COLA CAJERO (FIFO) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Cola Cajero (FIFO)
                  </h3>
                  <span className="text-xs text-slate-500">
                    {cajeroQueue.length === 0 ? 'No hay personas esperando en la fila' : `${cajeroQueue.length} persona(s) esperando`}
                  </span>
                </div>
              </div>

              {/* Botones de llegada y asignación rápida */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleClientArrival('personalizada')}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Llegada a Cola Cajero</span>
                </button>

                {cajeroQueue.length > 0 && (!cajero1.isRunning || !cajero2.isRunning) && (
                  <button
                    type="button"
                    onClick={handleAutoAssignCajero}
                    className="px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all"
                    title="Asignar al primer cajero que esté libre"
                  >
                    Atender Siguiente
                  </button>
                )}
              </div>
            </div>

            {/* Lista de personas esperando en Cola Cajero */}
            {cajeroQueue.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                {cajeroQueue.map((item, idx) => {
                  const waitSecs = getQueueWaitSeconds(item);
                  const isFirstInLine = idx === 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isFirstInLine
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-slate-900">
                            Cliente #{item.clientNumber}
                          </span>
                          {isFirstInLine && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                              1° en fila
                            </span>
                          )}
                        </div>
                        <div className="font-mono-numbers text-sm font-bold text-emerald-900">
                          {formatDuration(waitSecs)} ({waitSecs.toFixed(1)}s)
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleMoveToCajero(1, item)}
                          disabled={cajero1.isRunning || getServerElapsedSeconds(cajero1) > 0}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-bold shadow-2xs transition-all"
                          title="Asignar a Cajero 1"
                        >
                          ➔ C1
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveToCajero(2, item)}
                          disabled={cajero2.isRunning || getServerElapsedSeconds(cajero2) > 0}
                          className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-bold shadow-2xs transition-all"
                          title="Asignar a Cajero 2"
                        >
                          ➔ C2
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue('personalizada', item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Descartar (Abandono de fila)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2.2 SUB-SECCIÓN: LOS 2 CAJEROS EN PARALELO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[cajero1, cajero2].map((cajero, cIdx) => {
              const cajeroNumber = (cIdx + 1) as 1 | 2;
              const isServerRunning = cajero.isRunning;
              const elapsedSecs = getServerElapsedSeconds(cajero);
              const isIdle = !isServerRunning && elapsedSecs === 0;

              return (
                <div
                  key={cajero.serverId}
                  className={`bg-white rounded-2xl p-5 border-2 transition-all shadow-xs ${
                    isServerRunning
                      ? 'border-emerald-500 ring-3 ring-emerald-500/15 shadow-md'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Bar inside Cashier Card */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          isServerRunning
                            ? 'bg-emerald-500 animate-ping'
                            : elapsedSecs > 0
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {cajero.serverName}
                      </span>
                      {cajero.clientNumber && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Cliente #{cajero.clientNumber}
                        </span>
                      )}
                    </div>

                    {/* Badge Espera en Cola previa */}
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      Espera en cola: <strong className="font-mono">{cajero.queueWaitTimeSeconds.toFixed(1)}s</strong>
                    </div>
                  </div>

                  {/* OPERATION TYPE SELECTOR: Compra vs Retiro */}
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Tipo de Trámite del Cliente:
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setOperationType(cajero.serverId as any, 'adquisicion')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          cajero.operationType === 'adquisicion'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>💳</span>
                        <span>Compra</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOperationType(cajero.serverId as any, 'retiro_web')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          cajero.operationType === 'retiro_web'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>📱</span>
                        <span>Retirar Web</span>
                      </button>
                    </div>
                  </div>

                  {/* Digital Timer Display */}
                  <div className="text-center py-2">
                    <div className="timer-hero-box rounded-2xl p-4 max-w-xs mx-auto">
                      <div className="font-mono-numbers text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        {formatDuration(elapsedSecs)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Atención: {elapsedSecs.toFixed(2)}s
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción del Cajero */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-1">
                      {elapsedSecs > 0 && (
                        <button
                          type="button"
                          onClick={() => setServerToDiscard(cajero)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Descartar esta atención"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {elapsedSecs > 0 && !isServerRunning && (
                        <button
                          type="button"
                          onClick={() => handleResetServer(cajero.serverId as any)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Reiniciar a cero"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap justify-end">
                      {isIdle ? (
                        <>
                          <button
                            type="button"
                            disabled={cajeroQueue.length === 0}
                            onClick={() => handleMoveToCajero(cajeroNumber)}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-1.5"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Atender de Cola (FIFO)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveToCajero(cajeroNumber)}
                            className="px-2.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                            title="Iniciar atención directa sin cola"
                          >
                            Sin cola
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Pausa / Reanudar */}
                          <button
                            type="button"
                            onClick={() => togglePauseServer(cajero.serverId as any)}
                            className={`px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-1.5 text-white ${
                              isServerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {isServerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            <span>{isServerRunning ? 'Pausar' : 'Reanudar'}</span>
                          </button>

                          {/* Finalizar y Guardar */}
                          <button
                            type="button"
                            disabled={elapsedSecs < 0.5 || savingServerId === cajero.serverId}
                            onClick={() => handleFinishAndSave(cajero)}
                            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{savingServerId === cajero.serverId ? 'Guardando...' : 'Finalizar y Guardar'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Confirmación Descarte */}
      {serverToDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">¿Descartar atención?</h3>
            </div>
            <p className="text-sm text-slate-600">
              Se descartará la medición activa en <strong>{serverToDiscard.serverName}</strong> sin guardarla en los registros.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setServerToDiscard(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
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
