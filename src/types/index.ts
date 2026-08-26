export interface UserProfile {
  id: number;
  name: string;
}

export interface ProcessDefinition {
  id: string;
  order: number;
  name: string;
}

export interface SimulationSystem {
  id: string;
  name: string;
  description?: string;
  processes: ProcessDefinition[];
  createdAt: string;
}

export interface ProcessTimeRecord {
  processId: string;
  processName: string;
  durationSeconds: number;
}

export interface SampleRecord {
  id: string;
  systemId: string;
  systemName: string;
  userId: number;
  userName: string;
  timestamp: string; // ISO 8601
  processTimes: ProcessTimeRecord[];
  totalSystemTimeSeconds: number;
  notes?: string;
}

export type BackendStatus = 'checking' | 'online' | 'sleeping' | 'offline';
