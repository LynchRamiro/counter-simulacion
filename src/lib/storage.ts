import { UserProfile, SimulationSystem, SampleRecord } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'counter_current_user_id',
  USERS: 'counter_users',
  SYSTEMS: 'counter_systems',
  RECORDS: 'counter_records',
  BACKEND_URL: 'counter_backend_url',
};

export const DEFAULT_USERS: UserProfile[] = [
  { id: 1, name: 'Usuario 1' },
  { id: 2, name: 'Usuario 2' },
  { id: 3, name: 'Usuario 3' },
  { id: 4, name: 'Usuario 4' },
  { id: 5, name: 'Usuario 5' },
];

export const DEFAULT_SYSTEMS: SimulationSystem[] = [
  {
    id: 'sys-default-1',
    name: 'Caja de Cobro - Supermercado',
    description: 'Medición de cola y atención en caja tradicional',
    createdAt: new Date().toISOString(),
    processes: [
      { id: 'proc-1', order: 1, name: 'Espera en Cola' },
      { id: 'proc-2', order: 2, name: 'Escaneo de Productos' },
      { id: 'proc-3', order: 3, name: 'Pago y Facturación' },
    ],
  },
  {
    id: 'sys-default-2',
    name: 'Ventanilla de Banco',
    description: 'Medición de espera en sala y atención de trámite',
    createdAt: new Date().toISOString(),
    processes: [
      { id: 'proc-1', order: 1, name: 'Espera en Sala' },
      { id: 'proc-2', order: 2, name: 'Atención de Operación' },
    ],
  },
];

export const LocalStore = {
  // Current User Session
  getCurrentUserId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return raw ? Number(raw) : null;
  },

  setCurrentUserId(id: number | null) {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, String(id));
    }
  },

  // Users List
  getUsers(): UserProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading users from localStorage:', e);
    }
    return DEFAULT_USERS;
  },

  saveUsers(users: UserProfile[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Systems List
  getSystems(): SimulationSystem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYSTEMS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading systems from localStorage:', e);
    }
    return DEFAULT_SYSTEMS;
  },

  saveSystems(systems: SimulationSystem[]) {
    localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify(systems));
  },

  // Records List
  getRecords(): SampleRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading records from localStorage:', e);
    }
    return [];
  },

  saveRecords(records: SampleRecord[]) {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },

  addRecord(record: SampleRecord) {
    const existing = this.getRecords();
    const updated = [record, ...existing];
    this.saveRecords(updated);
    return updated;
  },

  deleteRecord(id: string) {
    const existing = this.getRecords();
    const updated = existing.filter((r) => r.id !== id);
    this.saveRecords(updated);
    return updated;
  },

  // Backend Custom URL configuration
  getBackendUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.BACKEND_URL) || (import.meta.env.VITE_API_URL || '');
  },

  setBackendUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url.trim());
  },
};
