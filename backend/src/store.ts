import fs from 'fs';
import path from 'path';
import { DatabaseSchema, UserProfile, SimulationSystem, SampleRecord } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DATA: DatabaseSchema = {
  users: [
    { id: 1, name: 'Usuario 1' },
    { id: 2, name: 'Usuario 2' },
    { id: 3, name: 'Usuario 3' },
    { id: 4, name: 'Usuario 4' },
    { id: 5, name: 'Usuario 5' },
  ],
  systems: [
    {
      id: 'sys-default-1',
      name: 'Caja de Cobro - Supermercado',
      description: 'Cola y atención en puesto de caja tradicional',
      createdAt: new Date().toISOString(),
      processes: [
        { id: 'proc-1', order: 1, name: 'Espera en Cola' },
        { id: 'proc-2', order: 2, name: 'Escaneo de Productos' },
        { id: 'proc-3', order: 3, name: 'Pago y Facturación' },
      ],
    },
    {
      id: 'sys-default-2',
      name: 'Atención en Ventanilla Bancaria',
      description: 'Medición de espera y trámite en sucursal bancaria',
      createdAt: new Date().toISOString(),
      processes: [
        { id: 'proc-1', order: 1, name: 'Espera en Sala' },
        { id: 'proc-2', order: 2, name: 'Atención de Operación' },
      ],
    },
  ],
  records: [],
};

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          users: parsed.users || DEFAULT_DATA.users,
          systems: parsed.systems || DEFAULT_DATA.systems,
          records: parsed.records || [],
        };
      } else {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
    } catch (error) {
      console.error('Error loading database file, using in-memory state:', error);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing database to disk:', error);
    }
  }

  // Users
  getUsers(): UserProfile[] {
    return this.data.users;
  }

  updateUsers(newUsers: UserProfile[]): UserProfile[] {
    // Ensure we maintain 5 users
    if (Array.isArray(newUsers) && newUsers.length > 0) {
      this.data.users = newUsers.slice(0, 5).map((u, idx) => ({
        id: u.id || idx + 1,
        name: (u.name || `Usuario ${idx + 1}`).trim(),
      }));
      this.persist();
    }
    return this.data.users;
  }

  // Systems
  getSystems(): SimulationSystem[] {
    return this.data.systems;
  }

  getSystemById(id: string): SimulationSystem | undefined {
    return this.data.systems.find((s) => s.id === id);
  }

  createSystem(system: Omit<SimulationSystem, 'id' | 'createdAt'>): SimulationSystem {
    const newSystem: SimulationSystem = {
      ...system,
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.systems.push(newSystem);
    this.persist();
    return newSystem;
  }

  deleteSystem(id: string): boolean {
    const initialLength = this.data.systems.length;
    this.data.systems = this.data.systems.filter((s) => s.id !== id);
    if (this.data.systems.length !== initialLength) {
      this.persist();
      return true;
    }
    return false;
  }

  // Records
  getRecords(systemId?: string): SampleRecord[] {
    if (systemId) {
      return this.data.records.filter((r) => r.systemId === systemId);
    }
    return this.data.records;
  }

  createRecord(record: Omit<SampleRecord, 'id'>): SampleRecord {
    const newRecord: SampleRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: record.timestamp || new Date().toISOString(),
    };
    this.data.records.unshift(newRecord); // newest first
    this.persist();
    return newRecord;
  }

  deleteRecord(id: string): boolean {
    const initialLength = this.data.records.length;
    this.data.records = this.data.records.filter((r) => r.id !== id);
    if (this.data.records.length !== initialLength) {
      this.persist();
      return true;
    }
    return false;
  }
}

export const db = new Store();
