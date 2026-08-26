import { UserProfile, SimulationSystem, SampleRecord } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'counter_current_user_id',
  USERS: 'counter_users',
  SYSTEMS: 'counter_systems',
  RECORDS: 'counter_records',
};

export const DEFAULT_USERS: UserProfile[] = [
  { id: 1, name: 'Usuario 1' },
  { id: 2, name: 'Usuario 2' },
  { id: 3, name: 'Usuario 3' },
  { id: 4, name: 'Usuario 4' },
  { id: 5, name: 'Usuario 5' },
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
      if (raw !== null) {
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
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed; // Allow empty array if user deleted all systems
      }
    } catch (e) {
      console.error('Error reading systems from localStorage:', e);
    }
    // Return empty list if nothing stored yet
    return [];
  },

  saveSystems(systems: SimulationSystem[]) {
    localStorage.setItem(STORAGE_KEYS.SYSTEMS, JSON.stringify(systems));
  },

  // Records List
  getRecords(): SampleRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (raw !== null) {
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
    const updated = [record, ...existing.filter((r) => r.id !== record.id)];
    this.saveRecords(updated);
    return updated;
  },

  deleteRecord(id: string) {
    const existing = this.getRecords();
    const updated = existing.filter((r) => r.id !== id);
    this.saveRecords(updated);
    return updated;
  },
};
