import { UserProfile, SimulationSystem, SampleRecord, BackendStatus } from '../types';
import { LocalStore } from './storage';

function getBaseApiUrl(): string {
  const customUrl = LocalStore.getBackendUrl();
  if (customUrl) return customUrl.replace(/\/$/, '');
  return '';
}

export const ApiClient = {
  /**
   * Health check / Ping flag endpoint for Render
   */
  async checkHealth(): Promise<{ status: BackendStatus; latencyMs?: number; message?: string }> {
    const start = performance.now();
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/health` : '/api/health';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        return {
          status: 'online',
          latencyMs,
          message: data.message || 'Servidor activo',
        };
      } else {
        return {
          status: 'offline',
          latencyMs,
          message: `Error HTTP ${res.status}`,
        };
      }
    } catch (err: any) {
      // If it aborted due to timeout, it's likely sleeping on Render free tier
      if (err.name === 'AbortError') {
        return {
          status: 'sleeping',
          message: 'El servidor está despertando (Render)...',
        };
      }
      return {
        status: 'offline',
        message: 'No se pudo conectar con el backend (usando almacenamiento local)',
      };
    }
  },

  // USERS
  async getUsers(): Promise<UserProfile[]> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/users` : '/api/users';
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        LocalStore.saveUsers(data);
        return data;
      }
    } catch {
      // Fallback
    }
    return LocalStore.getUsers();
  },

  async updateUsers(users: UserProfile[]): Promise<UserProfile[]> {
    LocalStore.saveUsers(users);
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/users` : '/api/users';
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
      if (res.ok) {
        const data = await res.json();
        LocalStore.saveUsers(data);
        return data;
      }
    } catch {
      // Fallback already saved locally
    }
    return users;
  },

  // SYSTEMS
  async getSystems(): Promise<SimulationSystem[]> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/systems` : '/api/systems';
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        LocalStore.saveSystems(data);
        return data;
      }
    } catch {
      // Fallback
    }
    return LocalStore.getSystems();
  },

  async createSystem(system: { name: string; description?: string; processes: { name: string; order: number }[] }): Promise<SimulationSystem> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/systems` : '/api/systems';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(system),
      });
      if (res.ok) {
        const created = await res.json();
        const existing = LocalStore.getSystems();
        LocalStore.saveSystems([...existing, created]);
        return created;
      }
    } catch {
      // Fallback local creation
    }

    const localNewSystem: SimulationSystem = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: system.name,
      description: system.description,
      createdAt: new Date().toISOString(),
      processes: system.processes.map((p, idx) => ({
        id: `proc-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        order: p.order,
        name: p.name,
      })),
    };
    const existing = LocalStore.getSystems();
    LocalStore.saveSystems([...existing, localNewSystem]);
    return localNewSystem;
  },

  async deleteSystem(id: string): Promise<boolean> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/systems/${id}` : `/api/systems/${id}`;
    let backendSuccess = false;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      backendSuccess = res.ok;
    } catch {
      // Offline fallback
    }

    const existing = LocalStore.getSystems();
    LocalStore.saveSystems(existing.filter((s) => s.id !== id));
    return backendSuccess || true;
  },

  // RECORDS
  async getRecords(systemId?: string): Promise<SampleRecord[]> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl
      ? `${baseUrl}/api/records${systemId ? `?systemId=${systemId}` : ''}`
      : `/api/records${systemId ? `?systemId=${systemId}` : ''}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // If query wasn't filtered, save all locally
        if (!systemId) {
          LocalStore.saveRecords(data);
        }
        return data;
      }
    } catch {
      // Fallback
    }
    const localRecords = LocalStore.getRecords();
    return systemId ? localRecords.filter((r) => r.systemId === systemId) : localRecords;
  },

  async createRecord(record: Omit<SampleRecord, 'id'>): Promise<SampleRecord> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/records` : '/api/records';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const created = await res.json();
        LocalStore.addRecord(created);
        return created;
      }
    } catch {
      // Fallback local record
    }

    const localRecord: SampleRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: record.timestamp || new Date().toISOString(),
    };
    LocalStore.addRecord(localRecord);
    return localRecord;
  },

  async deleteRecord(id: string): Promise<boolean> {
    const baseUrl = getBaseApiUrl();
    const url = baseUrl ? `${baseUrl}/api/records/${id}` : `/api/records/${id}`;
    let backendSuccess = false;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      backendSuccess = res.ok;
    } catch {
      // Fallback
    }

    LocalStore.deleteRecord(id);
    return backendSuccess || true;
  },
};
