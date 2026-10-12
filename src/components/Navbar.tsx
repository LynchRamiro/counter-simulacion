import React, { useState } from 'react';
import { Timer, ClipboardList, BookOpen, User, Users, RefreshCw, Database } from 'lucide-react';
import { UserProfile, BackendStatus } from '../types';

interface NavbarProps {
  activeTab: 'timer' | 'records' | 'info';
  setActiveTab: (tab: 'timer' | 'records' | 'info') => void;
  currentUser: UserProfile | null;
  onOpenUserSelect: () => void;
  onOpenUserSettings: () => void;
  backendStatus: BackendStatus;
  backendLatency?: number;
  onCheckBackend: () => void;
  onOpenBackendSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenUserSelect,
  onOpenUserSettings,
  backendStatus,
  backendLatency,
  onCheckBackend,
  onOpenBackendSettings,
}) => {
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinging(true);
    await onCheckBackend();
    setTimeout(() => setIsPinging(false), 500);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('timer')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">SimuTimer Cine</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  TPI Simulación
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Medición simultánea de colas: Tótem y Atención personalizada</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'timer'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Cronómetros</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'records'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Registros y Métricas</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'info'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Modelo del Sistema</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2">
            {/* Supabase Status Pill */}
            <div
              onClick={onOpenBackendSettings}
              className={`group flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                backendStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click para ver estado de base de datos Supabase"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <Database className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">
                {backendStatus === 'online'
                  ? `Supabase${backendLatency !== undefined ? ` (${backendLatency}ms)` : ''}`
                  : 'Modo Local'}
              </span>
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="p-0.5 hover:bg-white/60 rounded text-slate-600 hover:text-slate-900"
                title="Comprobar conexión"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* Current Active User Profile */}
            {currentUser ? (
              <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={onOpenUserSelect}
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-lg text-sm font-medium text-slate-800 hover:bg-white transition-colors"
                  title="Cambiar de operador"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.id}
                  </div>
                  <span className="max-w-[90px] sm:max-w-[120px] truncate font-semibold">{currentUser.name}</span>
                </button>
                <button
                  onClick={onOpenUserSettings}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white transition-colors"
                  title="Configurar nombres de usuarios"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenUserSelect}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Elegir Usuario</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Bottom Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold ${
              activeTab === 'timer' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Timer className="w-5 h-5 mb-0.5" />
            <span>Cronómetros</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold ${
              activeTab === 'records' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>Registros</span>
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold ${
              activeTab === 'info' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span>Modelo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
