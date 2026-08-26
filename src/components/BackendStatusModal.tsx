import React, { useState } from 'react';
import { Database, X, RefreshCw, CheckCircle, AlertCircle, Sparkles, Key, Globe, ShieldCheck } from 'lucide-react';
import { BackendStatus } from '../types';
import { getSupabaseCredentials, saveSupabaseCredentials } from '../lib/supabase';

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
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [isConnecting, setIsConnecting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    saveSupabaseCredentials(url, anonKey);
    await onReloadAllData();
    await onPing();
    setIsConnecting(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClear = async () => {
    setUrl('');
    setAnonKey('');
    saveSupabaseCredentials('', '');
    await onReloadAllData();
    await onPing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Conexión a Base de Datos Supabase</h3>
              <p className="text-xs text-slate-500">Sincronización en la nube y tiempo real para los 5 usuarios</p>
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
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {status === 'online' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {status === 'online'
                    ? '🟢 Conectado a Supabase (PostgreSQL)'
                    : '🟡 Modo Local (Sin Conexión Cloud)'}
                </span>
                {latency !== undefined && (
                  <span className="text-xs font-mono font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                    {latency} ms
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {message || (status === 'online' ? 'Sincronización en tiempo real habilitada.' : 'Guarda datos solo en este navegador')}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Project URL (de Supabase):</span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzabcdefg.supabase.co"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Anon / Public API Key:</span>
              </label>
              <input
                type="password"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
              />
            </div>

            {saveSuccess && (
              <div className="text-xs text-emerald-700 font-semibold flex items-center space-x-1.5 bg-emerald-50 p-2 rounded border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Credenciales guardadas y sincronización iniciada.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-rose-600 underline"
              >
                Limpiar credenciales
              </button>

              <button
                type="submit"
                disabled={isConnecting || !url.trim() || !anonKey.trim()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Probando...' : 'Conectar y Guardar'}</span>
              </button>
            </div>
          </form>

          {/* Quick Guide Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>¿Cómo crear tu base en 1 minuto?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <li>Crea un proyecto gratis en <strong>supabase.com</strong>.</li>
              <li>Abre el <strong>SQL Editor</strong> en Supabase, pega el script de <code>supabase_schema.sql</code> y haz clic en <strong>Run</strong>.</li>
              <li>En <strong>Project Settings → API</strong>, copia tu URL y tu <code>anon public</code> key y pégalas aquí.</li>
            </ol>
          </div>
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
