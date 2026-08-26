import React, { useState } from 'react';
import { Server, X, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { BackendStatus } from '../types';
import { LocalStore } from '../lib/storage';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: BackendStatus;
  latency?: number;
  message?: string;
  onPing: () => Promise<void>;
  onReloadAllData: () => Promise<void>;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  latency,
  message,
  onPing,
  onReloadAllData,
}) => {
  const [customUrl, setCustomUrl] = useState(LocalStore.getBackendUrl());
  const [isPinging, setIsPinging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePingTest = async () => {
    setIsPinging(true);
    await onPing();
    setIsPinging(false);
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    LocalStore.setBackendUrl(customUrl);
    setSaveSuccess(true);
    await onReloadAllData();
    await onPing();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Estado del Backend & Servidor</h3>
              <p className="text-xs text-slate-500">Comprobación de conectividad y endpoints de salud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
              status === 'online'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : status === 'sleeping'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {status === 'online' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : status === 'sleeping' ? (
                <Clock className="w-6 h-6 text-amber-600 animate-spin" />
              ) : (
                <AlertCircle className="w-6 h-6 text-slate-500" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {status === 'online'
                    ? '🟢 Servidor Backend Activo y Conectado'
                    : status === 'sleeping'
                    ? '🟡 Servidor en Reposo (Despertando...)'
                    : '⚪ Modo Almacenamiento Local (Offline)'}
                </span>
                {latency && (
                  <span className="text-xs font-mono font-semibold bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    {latency} ms
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90">
                {message || (status === 'online' ? 'Respondiendo correctamente a peticiones.' : 'No conectado')}
              </p>
            </div>
          </div>

          {/* Test Ping Button */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-700">Petición Bandera (Flag Endpoint)</div>
              <div className="text-[11px] text-slate-500">Prueba el endpoint <code className="font-mono text-slate-700">GET /api/health</code></div>
            </div>
            <button
              onClick={handlePingTest}
              disabled={isPinging}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Comprobando...' : 'Comprobar Ahora'}</span>
            </button>
          </div>

          {/* Render URL Configuration */}
          <form onSubmit={handleSaveUrl} className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase text-slate-700">
              URL del Backend en Render / Producción:
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Ej: https://counter-simulacion-api.onrender.com"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
              >
                Guardar URL
              </button>
            </div>

            {saveSuccess && (
              <div className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>URL guardada y reconectando...</span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 <strong>Nota sobre Render:</strong> Los servidores gratuitos en Render entran en suspensión tras 15 min sin uso. Si entran en reposo, este botón los despertará antes de que comiencen la toma de muestras.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
