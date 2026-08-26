import { Router, Request, Response } from 'express';
import { db } from './store';

const router = Router();

// Health check flag endpoint for Render
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend de Simulación activo y respondiendo.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Users endpoints
router.get('/users', (_req: Request, res: Response) => {
  res.json(db.getUsers());
});

router.put('/users', (req: Request, res: Response) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Formato inválido. Se espera un array de usuarios.' });
  }
  const updated = db.updateUsers(users);
  res.json(updated);
});

// Systems endpoints
router.get('/systems', (_req: Request, res: Response) => {
  res.json(db.getSystems());
});

router.post('/systems', (req: Request, res: Response) => {
  const { name, description, processes } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del sistema es obligatorio.' });
  }
  if (!Array.isArray(processes) || processes.length === 0) {
    return res.status(400).json({ error: 'Debe definir al menos un proceso para el sistema.' });
  }

  const sanitizedProcesses = processes.map((p: any, idx: number) => ({
    id: p.id || `proc-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`,
    order: typeof p.order === 'number' ? p.order : idx + 1,
    name: (p.name || `Proceso ${idx + 1}`).trim(),
  }));

  const created = db.createSystem({
    name: name.trim(),
    description: description ? description.trim() : '',
    processes: sanitizedProcesses,
  });

  res.status(201).json(created);
});

router.delete('/systems/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = db.deleteSystem(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Sistema no encontrado.' });
  }
  res.json({ success: true, message: 'Sistema eliminado con éxito.' });
});

// Records endpoints
router.get('/records', (req: Request, res: Response) => {
  const systemId = req.query.systemId ? String(req.query.systemId) : undefined;
  const records = db.getRecords(systemId);
  res.json(records);
});

router.post('/records', (req: Request, res: Response) => {
  const { systemId, systemName, userId, userName, processTimes, totalSystemTimeSeconds, notes } = req.body;

  if (!systemId || !userId || !Array.isArray(processTimes) || typeof totalSystemTimeSeconds !== 'number') {
    return res.status(400).json({ error: 'Datos de registro incompletos o inválidos.' });
  }

  const created = db.createRecord({
    systemId,
    systemName: systemName || 'Sistema sin nombre',
    userId: Number(userId),
    userName: userName || `Usuario ${userId}`,
    timestamp: new Date().toISOString(),
    processTimes,
    totalSystemTimeSeconds,
    notes: notes || '',
  });

  res.status(201).json(created);
});

router.delete('/records/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = db.deleteRecord(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Registro no encontrado.' });
  }
  res.json({ success: true, message: 'Registro eliminado con éxito.' });
});

export default router;
