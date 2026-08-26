import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TimerEngine } from './components/TimerEngine';
import { RecordsPanel } from './components/RecordsPanel';
import { SystemManager } from './components/SystemManager';
import { UserSelectionModal } from './components/UserSelectionModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { BackendStatusModal } from './components/BackendStatusModal';
import { ApiClient } from './lib/api';
import { LocalStore } from './lib/storage';
import { UserProfile, SimulationSystem, SampleRecord, BackendStatus } from './types';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'timer' | 'records' | 'systems'>('timer');

  // Application Data State
  const [users, setUsers] = useState<UserProfile[]>(LocalStore.getUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [systems, setSystems] = useState<SimulationSystem[]>(LocalStore.getSystems());
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [records, setRecords] = useState<SampleRecord[]>(LocalStore.getRecords());

  // Backend Health Status
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [backendLatency, setBackendLatency] = useState<number | undefined>(undefined);
  const [backendMessage, setBackendMessage] = useState<string | undefined>(undefined);

  // Modals
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isBackendStatusOpen, setIsBackendStatusOpen] = useState(false);

  // Check Backend Health
  const handleCheckBackend = useCallback(async () => {
    const res = await ApiClient.checkHealth();
    setBackendStatus(res.status);
    setBackendLatency(res.latencyMs);
    setBackendMessage(res.message);
    return res;
  }, []);

  // Initial Data Fetch
  const loadAllData = useCallback(async () => {
    // 1. Fetch Users
    const fetchedUsers = await ApiClient.getUsers();
    setUsers(fetchedUsers);

    // Resolve current user
    const savedUserId = LocalStore.getCurrentUserId();
    if (savedUserId) {
      const match = fetchedUsers.find((u) => u.id === savedUserId);
      if (match) {
        setCurrentUser(match);
      } else {
        setIsUserSelectOpen(true);
      }
    } else {
      setIsUserSelectOpen(true);
    }

    // 2. Fetch Systems
    const fetchedSystems = await ApiClient.getSystems();
    setSystems(fetchedSystems);
    if (fetchedSystems.length > 0) {
      setSelectedSystemId((prev) => (prev && fetchedSystems.some((s) => s.id === prev) ? prev : fetchedSystems[0].id));
    }

    // 3. Fetch Records
    const fetchedRecords = await ApiClient.getRecords();
    setRecords(fetchedRecords);
  }, []);

  useEffect(() => {
    handleCheckBackend();
    loadAllData();
  }, [handleCheckBackend, loadAllData]);

  // Realtime subscription setup
  useEffect(() => {
    const unsubscribe = ApiClient.subscribeToRealtime(
      (newRecord) => {
        setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
      },
      (deletedId) => {
        setRecords((prev) => prev.filter((r) => r.id !== deletedId));
      },
      async () => {
        const updated = await ApiClient.getSystems();
        setSystems(updated);
      },
      async () => {
        const updated = await ApiClient.getUsers();
        setUsers(updated);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Handler: Select User
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    LocalStore.setCurrentUserId(user.id);
    setIsUserSelectOpen(false);
  };

  // Handler: Save User Names Configuration
  const handleSaveUsers = async (updatedUsers: UserProfile[]) => {
    const saved = await ApiClient.updateUsers(updatedUsers);
    setUsers(saved);
    if (currentUser) {
      const updatedCurrent = saved.find((u) => u.id === currentUser.id);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }
  };

  // Handler: Save Sample Record
  const handleSaveRecord = async (recordData: Omit<SampleRecord, 'id'>): Promise<SampleRecord> => {
    const saved = await ApiClient.createRecord(recordData);
    setRecords((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
    return saved;
  };

  // Handler: Delete Sample Record
  const handleDeleteRecord = async (id: string) => {
    await ApiClient.deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Handler: Create System
  const handleCreateSystem = async (systemData: {
    name: string;
    description?: string;
    processes: { name: string; order: number }[];
  }) => {
    const created = await ApiClient.createSystem(systemData);
    setSystems((prev) => [...prev.filter((s) => s.id !== created.id), created]);
    setSelectedSystemId(created.id);
  };

  // Handler: Delete System
  const handleDeleteSystem = async (id: string) => {
    await ApiClient.deleteSystem(id);
    setSystems((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (selectedSystemId === id) {
        setSelectedSystemId(remaining.length > 0 ? remaining[0].id : '');
      }
      return remaining;
    });
  };

  // Handler: Select System and Jump to Timer
  const handleSelectAndMeasure = (systemId: string) => {
    setSelectedSystemId(systemId);
    setActiveTab('timer');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenUserSelect={() => setIsUserSelectOpen(true)}
        onOpenUserSettings={() => setIsUserSettingsOpen(true)}
        backendStatus={backendStatus}
        backendLatency={backendLatency}
        onCheckBackend={handleCheckBackend}
        onOpenBackendSettings={() => setIsBackendStatusOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'timer' && (
          <TimerEngine
            systems={systems}
            selectedSystemId={selectedSystemId}
            onSelectSystemId={setSelectedSystemId}
            currentUser={currentUser}
            onSaveRecord={handleSaveRecord}
            onNavigateToRecords={() => setActiveTab('records')}
          />
        )}

        {activeTab === 'records' && (
          <RecordsPanel
            records={records}
            systems={systems}
            users={users}
            onDeleteRecord={handleDeleteRecord}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'systems' && (
          <SystemManager
            systems={systems}
            onCreateSystem={handleCreateSystem}
            onDeleteSystem={handleDeleteSystem}
            onSelectAndMeasure={handleSelectAndMeasure}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>SimuTimer — Medición de Tiempos en Sistemas de Colas & Procesos</div>
          <div className="text-slate-400">Sincronización multiusuario en tiempo real</div>
        </div>
      </footer>

      {/* User Selection Modal (Open on startup if no user selected) */}
      <UserSelectionModal
        isOpen={isUserSelectOpen}
        users={users}
        currentUserId={currentUser?.id ?? null}
        onSelectUser={handleSelectUser}
        onClose={() => setIsUserSelectOpen(false)}
        canClose={currentUser !== null}
      />

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        users={users}
        onSave={handleSaveUsers}
        onClose={() => setIsUserSettingsOpen(false)}
      />

      {/* Supabase Status & Connection Modal */}
      <BackendStatusModal
        isOpen={isBackendStatusOpen}
        onClose={() => setIsBackendStatusOpen(false)}
        status={backendStatus}
        latency={backendLatency}
        message={backendMessage}
        onPing={async () => {
          await handleCheckBackend();
        }}
        onReloadAllData={loadAllData}
      />
    </div>
  );
};
