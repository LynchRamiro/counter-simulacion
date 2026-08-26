import React, { useState } from 'react';
import { Timer, ClipboardList, Settings2, User, Users, RefreshCw, Database } from 'lucide-react';
import { UserProfile, BackendStatus } from '../types';

interface NavbarProps {
  activeTab: 'timer' | 'records' | 'systems';
  setActiveTab: (tab: 'timer' | 'records' | 'systems') => void;
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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('timer')}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">SimuTimer</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Colas & Procesos
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Toma de tiempos en simultáneo para Simulación</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'timer'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Cronómetro</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'records'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Registros</span>
            </button>
            <button
              onClick={() => setActiveTab('systems')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'systems'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>Sistemas</span>
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
              title="Click para ver configuración de base de datos Supabase"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <Database className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">
                {backendStatus === 'online'
                  ? `Supabase Cloud${backendLatency !== undefined ? ` (${backendLatency}ms)` : ''}`
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
              <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button
                  onClick={onOpenUserSelect}
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-md text-sm font-medium text-slate-800 hover:bg-white transition-colors"
                  title="Cambiar de usuario"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.id}
                  </div>
                  <span className="max-w-[90px] sm:max-w-[120px] truncate">{currentUser.name}</span>
                </button>
                <button
                  onClick={onOpenUserSettings}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-white transition-colors"
                  title="Configurar nombres de usuarios"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenUserSelect}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
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
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium ${
              activeTab === 'timer' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Timer className="w-5 h-5 mb-0.5" />
            <span>Cronómetro</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium ${
              activeTab === 'records' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>Registros</span>
          </button>
          <button
            onClick={() => setActiveTab('systems')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium ${
              activeTab === 'systems' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Settings2 className="w-5 h-5 mb-0.5" />
            <span>Sistemas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
