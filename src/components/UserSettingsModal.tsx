import React, { useState, useEffect } from 'react';
import { Users, X, Save, RotateCcw } from 'lucide-react';
import { UserProfile } from '../types';

interface UserSettingsModalProps {
  isOpen: boolean;
  users: UserProfile[];
  onSave: (updatedUsers: UserProfile[]) => Promise<void>;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  users,
  onSave,
  onClose,
}) => {
  const [editedNames, setEditedNames] = useState<{ [key: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial: { [key: number]: string } = {};
      users.forEach((u) => {
        initial[u.id] = u.name;
      });
      setEditedNames(initial);
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const handleChange = (id: number, val: string) => {
    setEditedNames((prev) => ({ ...prev, [id]: val }));
  };

  const handleResetDefaults = () => {
    const defaults: { [key: number]: string } = {};
    [1, 2, 3, 4, 5].forEach((id) => {
      defaults[id] = `Usuario ${id}`;
    });
    setEditedNames(defaults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated: UserProfile[] = users.map((u) => ({
      id: u.id,
      name: (editedNames[u.id] || `Usuario ${u.id}`).trim(),
    }));

    await onSave(updated);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Configurar Nombres de Usuarios</h3>
              <p className="text-xs text-slate-500">Personaliza los nombres de los 5 integrantes del equipo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {u.id}
                </span>
                <div className="flex-1">
                  <label className="sr-only">Nombre de Usuario {u.id}</label>
                  <input
                    type="text"
                    value={editedNames[u.id] ?? u.name}
                    onChange={(e) => handleChange(u.id, e.target.value)}
                    placeholder={`Nombre del integrante ${u.id}`}
                    maxLength={30}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer nombres</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
