import { UserProfile, SimulationSystem, SampleRecord } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'counter_current_user_id',
  USERS: 'counter_users',
  SYSTEMS: 'counter_systems',
  RECORDS: 'counter_records',
};

export const DEFAULT_USERS: UserProfile[] = [
  { id: 1, name: 'Camila' },
  { id: 2, name: 'Cecilia' },
  { id: 3, name: 'Gianella' },
  { id: 4, name: 'Ramiro' },
  { id: 5, name: 'Valentino' },
];

export const CINEMA_SYSTEMS: SimulationSystem[] = [
  {
    id: 'cine-totem',
    name: 'Tótem de Autoservicio',
    description: 'Cola 1: Sólo retiro de entradas adquiridas previamente por la app web',
    processes: [
      { id: 'proc-totem-retiro', order: 1, name: 'Retiro de entradas (App Web)' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cine-personalizada',
    name: 'Atención Personalizada',
    description: 'Cola 2: Boletería/Caja (Adquisición de entradas o Retiro app web)',
    processes: [
      { id: 'proc-pers-atencion', order: 1, name: 'Atención en Boletería' },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const normalizeCinemaRecord = (record: SampleRecord): SampleRecord => {
  const isTotem =
    record.systemId === 'cine-totem' ||
    record.systemName.toLowerCase().includes('totem');

  const queueType = record.queueType || (isTotem ? 'totem' : 'personalizada');

  let operationType = record.operationType;
  if (!operationType) {
    if (isTotem) {
      operationType = 'retiro_web';
    } else {
      const notesLower = (record.notes || '').toLowerCase();
      const procNameLower = (record.processTimes[0]?.processName || '').toLowerCase();
      if (notesLower.includes('adquis') || notesLower.includes('compra') || procNameLower.includes('adquis') || procNameLower.includes('compra')) {
        operationType = 'adquisicion';
      } else {
        operationType = 'retiro_web';
      }
    }
  }

  // Derive queueWaitTimeSeconds and serviceTimeSeconds
  let queueWait = record.queueWaitTimeSeconds;
  let serviceTime = record.serviceTimeSeconds;

  if (queueWait === undefined || serviceTime === undefined) {
    const queueProc = record.processTimes.find(p => p.processId.includes('cola') || p.processName.toLowerCase().includes('cola') || p.processName.toLowerCase().includes('espera'));
    const servProc = record.processTimes.find(p => p.processId.includes('atencion') || p.processName.toLowerCase().includes('atencion') || p.processName.toLowerCase().includes('servicio') || p.processName.toLowerCase().includes('retiro') || p.processName.toLowerCase().includes('adquis'));

    if (queueProc && servProc) {
      queueWait = queueProc.durationSeconds;
      serviceTime = servProc.durationSeconds;
    } else {
      queueWait = queueWait ?? 0;
      serviceTime = serviceTime ?? record.totalSystemTimeSeconds;
    }
  }

  let serverName = record.serverName;
  if (!serverName) {
    if (isTotem) {
      serverName = 'Tótem Autoservicio';
    } else {
      const notesLower = (record.notes || '').toLowerCase();
      if (notesLower.includes('cajero 2')) {
        serverName = 'Cajero 2';
      } else {
        serverName = 'Cajero 1';
      }
    }
  }

  return {
    ...record,
    queueType,
    operationType,
    serverName,
    queueWaitTimeSeconds: Number(queueWait.toFixed(2)),
    serviceTimeSeconds: Number(serviceTime.toFixed(2)),
    totalSystemTimeSeconds: Number((queueWait + serviceTime).toFixed(2)),
    systemId: queueType === 'totem' ? 'cine-totem' : 'cine-personalizada',
    systemName: queueType === 'totem' ? 'Tótem de Autoservicio' : 'Atención Personalizada',
  };
};

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasGeneric = parsed.some((u: any) => typeof u.name === 'string' && u.name.startsWith('Usuario '));
          if (!hasGeneric) return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading users from localStorage:', e);
    }
    this.saveUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  },

  saveUsers(users: UserProfile[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Systems List (Cinema Dedicated)
  getSystems(): SimulationSystem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYSTEMS);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading systems from localStorage:', e);
    }
    return CINEMA_SYSTEMS;
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
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeCinemaRecord);
        }
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

  deleteRecords(ids: string[]) {
    const idSet = new Set(ids);
    const existing = this.getRecords();
    const updated = existing.filter((r) => !idSet.has(r.id));
    this.saveRecords(updated);
    return updated;
  },
};
