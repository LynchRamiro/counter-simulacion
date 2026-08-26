import { UserProfile, SimulationSystem, SampleRecord, BackendStatus } from '../types';
import { LocalStore } from './storage';
import { getSupabaseClient } from './supabase';

export const ApiClient = {
  /**
   * Health check / Ping test for Supabase or Local
   */
  async checkHealth(): Promise<{ status: BackendStatus; latencyMs?: number; message?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return {
        status: 'offline',
        message: 'Modo local (Configura Supabase para sincronizar entre dispositivos)',
      };
    }

    const start = performance.now();
    try {
      const { error } = await client.from('users').select('id', { count: 'exact', head: true });
      const latencyMs = Math.round(performance.now() - start);

      if (error) {
        return {
          status: 'offline',
          latencyMs,
          message: `Error al conectar con Supabase: ${error.message}`,
        };
      }

      return {
        status: 'online',
        latencyMs,
        message: 'Conectado exitosamente a Supabase Cloud (PostgreSQL)',
      };
    } catch (err: any) {
      return {
        status: 'offline',
        message: `Error de red: ${err.message || 'Sin conexión'}`,
      };
    }
  },

  // ================= USERS =================
  async getUsers(): Promise<UserProfile[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('users').select('*').order('id', { ascending: true });
        if (!error && data && data.length > 0) {
          const formatted: UserProfile[] = data.map((u: any) => ({
            id: u.id,
            name: u.name,
          }));
          LocalStore.saveUsers(formatted);
          return formatted;
        }
      } catch (e) {
        console.error('Error fetching users from Supabase:', e);
      }
    }
    return LocalStore.getUsers();
  },

  async updateUsers(users: UserProfile[]): Promise<UserProfile[]> {
    LocalStore.saveUsers(users);
    const client = getSupabaseClient();
    if (client) {
      try {
        const upsertPayload = users.map((u) => ({
          id: u.id,
          name: u.name,
        }));
        await client.from('users').upsert(upsertPayload);
      } catch (e) {
        console.error('Error updating users in Supabase:', e);
      }
    }
    return users;
  },

  // ================= SYSTEMS =================
  async getSystems(): Promise<SimulationSystem[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('systems')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          const formatted: SimulationSystem[] = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            processes: s.processes || [],
            createdAt: s.created_at || new Date().toISOString(),
          }));
          LocalStore.saveSystems(formatted);
          return formatted;
        }
      } catch (e) {
        console.error('Error fetching systems from Supabase:', e);
      }
    }
    return LocalStore.getSystems();
  },

  async createSystem(system: {
    name: string;
    description?: string;
    processes: { name: string; order: number }[];
  }): Promise<SimulationSystem> {
    const newSystem: SimulationSystem = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: system.name.trim(),
      description: (system.description || '').trim(),
      createdAt: new Date().toISOString(),
      processes: system.processes.map((p, idx) => ({
        id: `proc-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        order: p.order,
        name: p.name.trim(),
      })),
    };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('systems').insert({
          id: newSystem.id,
          name: newSystem.name,
          description: newSystem.description,
          processes: newSystem.processes,
          created_at: newSystem.createdAt,
        });
        if (error) {
          console.error('Error inserting system into Supabase:', error);
        }
      } catch (e) {
        console.error('Error inserting system into Supabase:', e);
      }
    }

    const existing = LocalStore.getSystems();
    LocalStore.saveSystems([...existing.filter((s) => s.id !== newSystem.id), newSystem]);
    return newSystem;
  },

  async deleteSystem(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('systems').delete().eq('id', id);
        if (error) {
          console.error('Error deleting system in Supabase:', error);
        }
      } catch (e) {
        console.error('Error deleting system in Supabase:', e);
      }
    }

    const existing = LocalStore.getSystems();
    LocalStore.saveSystems(existing.filter((s) => s.id !== id));
    return true;
  },

  // ================= RECORDS =================
  async getRecords(systemId?: string): Promise<SampleRecord[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        let query = client.from('records').select('*').order('timestamp', { ascending: false });
        if (systemId && systemId !== 'ALL') {
          query = query.eq('system_id', systemId);
        }

        const { data, error } = await query;
        if (!error && data) {
          const formatted: SampleRecord[] = data.map((r: any) => ({
            id: r.id,
            systemId: r.system_id,
            systemName: r.system_name,
            userId: r.user_id,
            userName: r.user_name,
            timestamp: r.timestamp,
            processTimes: r.process_times || [],
            totalSystemTimeSeconds: Number(r.total_system_time_seconds),
            notes: r.notes || '',
          }));

          if (!systemId || systemId === 'ALL') {
            LocalStore.saveRecords(formatted);
          }
          return formatted;
        }
      } catch (e) {
        console.error('Error fetching records from Supabase:', e);
      }
    }

    const localRecords = LocalStore.getRecords();
    return systemId && systemId !== 'ALL'
      ? localRecords.filter((r) => r.systemId === systemId)
      : localRecords;
  },

  async createRecord(record: Omit<SampleRecord, 'id'>): Promise<SampleRecord> {
    const newRecord: SampleRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: record.timestamp || new Date().toISOString(),
    };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('records').insert({
          id: newRecord.id,
          system_id: newRecord.systemId,
          system_name: newRecord.systemName,
          user_id: newRecord.userId,
          user_name: newRecord.userName,
          timestamp: newRecord.timestamp,
          process_times: newRecord.processTimes,
          total_system_time_seconds: newRecord.totalSystemTimeSeconds,
          notes: newRecord.notes || '',
        });
        if (error) {
          console.error('Error inserting record into Supabase:', error);
        }
      } catch (e) {
        console.error('Error inserting record into Supabase:', e);
      }
    }

    LocalStore.addRecord(newRecord);
    return newRecord;
  },

  async deleteRecord(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('records').delete().eq('id', id);
        if (error) {
          console.error('Error deleting record from Supabase:', error);
        }
      } catch (e) {
        console.error('Error deleting record from Supabase:', e);
      }
    }

    LocalStore.deleteRecord(id);
    return true;
  },

  /**
   * Realtime WebSockets listener across all 5 devices!
   */
  subscribeToRealtime(
    onRecordInsert: (newRecord: SampleRecord) => void,
    onRecordDelete: (deletedId: string) => void,
    onSystemChange: () => void,
    onUsersChange: () => void
  ) {
    const client = getSupabaseClient();
    if (!client) return () => {};

    const channel = client
      .channel('simutimer-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'records' },
        (payload) => {
          const r: any = payload.new;
          if (r && r.id) {
            onRecordInsert({
              id: r.id,
              systemId: r.system_id,
              systemName: r.system_name,
              userId: r.user_id,
              userName: r.user_name,
              timestamp: r.timestamp,
              processTimes: r.process_times || [],
              totalSystemTimeSeconds: Number(r.total_system_time_seconds),
              notes: r.notes || '',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'records' },
        (payload) => {
          const old: any = payload.old;
          if (old && old.id) {
            onRecordDelete(old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'systems' },
        () => {
          onSystemChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          onUsersChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  },
};
