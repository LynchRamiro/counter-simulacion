export type QueueType = 'totem' | 'personalizada';
export type OperationType = 'adquisicion' | 'retiro_web';

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
  queueType?: QueueType;
  operationType?: OperationType;
  serverName?: string; // 'Tótem de Autoservicio', 'Cajero 1', 'Cajero 2'
  userId: number;
  userName: string;
  timestamp: string; // ISO 8601
  queueWaitTimeSeconds?: number; // Tiempo de espera en la cola (FIFO)
  serviceTimeSeconds?: number;   // Tiempo de atención / autoservicio
  totalSystemTimeSeconds: number; // Tiempo total en el sistema (cola + atención)
  processTimes: ProcessTimeRecord[];
  notes?: string;
}

export type BackendStatus = 'checking' | 'online' | 'sleeping' | 'offline';

// Elemento individual esperando en la Cola FIFO
export interface QueueClientItem {
  id: string;
  clientNumber: number; // Ej: 1, 2, 3...
  queueType: QueueType; // 'totem' o 'personalizada'
  arrivalTime: number;  // performance.now()
  arrivalDateIso: string;
  notes?: string;
}

// Servidor de atención activo (Tótem, Cajero 1, Cajero 2)
export interface ServerStopwatch {
  serverId: string; // 'totem', 'cajero-1', 'cajero-2'
  serverName: string; // 'Tótem Autoservicio', 'Cajero 1', 'Cajero 2'
  queueType: QueueType;
  clientNumber?: number;
  queueWaitTimeSeconds: number; // Tiempo que esperó en cola
  operationType: OperationType; // 'adquisicion' (compra) o 'retiro_web' (retirar)
  startTime: number; // performance.now()
  accumulatedMs: number;
  isRunning: boolean;
  notes?: string;
}
