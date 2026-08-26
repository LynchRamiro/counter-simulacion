import React from 'react';
import { Users, Check, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface UserSelectionModalProps {
  isOpen: boolean;
  users: UserProfile[];
  currentUserId: number | null;
  onSelectUser: (user: UserProfile) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  users,
  currentUserId,
  onSelectUser,
  onClose,
  canClose = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">¿Quién está tomando tiempos?</h2>
              <p className="text-sm text-blue-100 mt-0.5">
                Selecciona tu usuario para identificar tus mediciones en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* User Selection List */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {users.map((user) => {
              const isSelected = currentUserId === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      {user.id}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-base">{user.name}</div>
                      <div className="text-xs text-slate-500">Muestreador #{user.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isSelected ? (
                      <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        <Check className="w-3.5 h-3.5" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cada usuario cronometra en su propio dispositivo</span>
            {canClose && onClose && (
              <button
                onClick={onClose}
                className="text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
