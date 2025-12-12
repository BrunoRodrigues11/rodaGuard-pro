
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, History as HistoryIcon, ShieldCheck, LogOut, ListChecks, Sun, Moon, Users, Settings } from 'lucide-react';
import { Task, RoundLog, AppView, ChecklistTemplate, User, UserRole, ReportConfig } from './types';
import Dashboard from './components/Dashboard';
import TaskCreator from './components/TaskCreator';
import ActiveRound from './components/ActiveRound';
import History from './components/History';
import TemplateManager from './components/TemplateManager';
import UserManager from './components/UserManager';
import ReportConfigScreen from './components/ReportConfig';
import Login from './components/Login';
import { api } from './services/api';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<RoundLog[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
      companyName: 'RondaGuard Pro', headerColor: '#3b82f6', logo: null
  });

  // UI State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Initialization: Load User from Session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ronda_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Initialization: Load Data when User is Logged In
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedLogs, fetchedTemplates, fetchedUsers, fetchedConfig] = await Promise.all([
        api.getTasks(),
        api.getRounds(),
        api.getTemplates(),
        api.getUsers(),
        api.getSettings()
      ]);

      setTasks(fetchedTasks);
      setLogs(fetchedLogs);
      setTemplates(fetchedTemplates);
      setUsersList(fetchedUsers);
      setReportConfig(fetchedConfig);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro de conexão com o servidor. Verifique se a API está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  // Theme Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('ronda_user', JSON.stringify(loggedInUser));
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('ronda_user');
    setCurrentView(AppView.DASHBOARD);
    setTasks([]);
    setLogs([]);
  };

  // --- Handlers ---
  
  // Tasks
  const handleSaveTask = async (task: Task) => {
    try {
        await api.saveTask(task);
        const updatedTasks = await api.getTasks();
        setTasks(updatedTasks);
        setTaskToEdit(null);
        setCurrentView(AppView.DASHBOARD);
    } catch (e) {
        alert("Erro ao salvar tarefa");
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCurrentView(AppView.CREATE_TASK);
  };

  const handleDuplicateTask = (task: Task) => {
    const taskCopy: Task = {
        ...task,
        id: Date.now().toString(), 
        title: `${task.title} (Cópia)`,
        createdAt: Date.now()
    };
    setTaskToEdit(taskCopy);
    setCurrentView(AppView.CREATE_TASK);
  };

  const handleDeleteTask = async (taskId: string) => {
      try {
          await api.deleteTask(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (e) {
          alert("Erro ao excluir tarefa");
      }
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
    setCurrentView(AppView.EXECUTE_ROUND);
  };

  const handleFinishRound = async (log: RoundLog) => {
    try {
        await api.saveRound(log);
        const updatedLogs = await api.getRounds();
        setLogs(updatedLogs);
        setActiveTask(null);
        setCurrentView(AppView.HISTORY);
    } catch (e) {
        alert("Erro ao salvar ronda");
    }
  };

  const handleUpdateLog = (updatedLog: RoundLog) => {
     // Implement if edit log is needed in future API
     console.log("Update log not implemented yet in backend for history view update");
  };

  const handleCancelCreate = () => {
    setTaskToEdit(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleCreateNewClick = () => {
    setTaskToEdit(null); 
    setCurrentView(AppView.CREATE_TASK);
  };

  // Templates
  const handleSaveTemplate = async (template: ChecklistTemplate) => {
    try {
        await api.saveTemplate(template);
        const updated = await api.getTemplates();
        setTemplates(updated);
    } catch (e) {
        alert("Erro ao salvar modelo");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
        await api.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
        alert("Erro ao excluir modelo");
    }
  };

  // Users
  const handleSaveUser = async (userToSave: User) => {
    try {
        await api.saveUser(userToSave);
        const updatedUsers = await api.getUsers();
        setUsersList(updatedUsers);
    } catch (e) {
        alert("Erro ao salvar usuário");
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
      const user = usersList.find(u => u.id === userId);
      if (user) {
          try {
              await api.toggleUserStatus(userId, !user.active);
              const updatedUsers = await api.getUsers();
              setUsersList(updatedUsers);
          } catch (e) {
              alert("Erro ao alterar status");
          }
      }
  };

  // Settings
  const handleSaveReportConfig = async (config: ReportConfig) => {
      try {
          await api.saveSettings(config);
          setReportConfig(config);
          setCurrentView(AppView.DASHBOARD);
      } catch (e) {
          alert("Erro ao salvar configurações");
      }
  };

  // --- Render Helpers ---

  if (!user) {
    return (
        <div className="font-sans">
            <div className="fixed top-4 right-4 z-50">
                 <button 
                    onClick={toggleTheme}
                    className="p-2 bg-white dark:bg-slate-800 text-slate-500 rounded-full shadow-md"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <Login onLogin={handleLogin} />
        </div>
    );
  }

  // Permission Logic
  const canCreate = user.role === UserRole.ANALYST || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canViewHistory = user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canManageTemplates = user.role === UserRole.ANALYST || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canManageUsers = user.role === UserRole.ADMIN;
  const canAccessSettings = user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR;

  const renderContent = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    switch(currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            tasks={tasks} 
            history={logs} 
            currentUser={user}
            onNavigate={setCurrentView}
            onStartTask={handleStartTask}
            onEditTask={handleEditTask}
            onDuplicateTask={handleDuplicateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case AppView.CREATE_TASK:
        if (!canCreate) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
          <TaskCreator 
            onSave={handleSaveTask} 
            onCancel={handleCancelCreate} 
            initialTask={taskToEdit}
            templates={templates}
          />
        );
      case AppView.EXECUTE_ROUND:
        return activeTask ? (
            <ActiveRound 
                task={activeTask} 
                currentUser={user}
                onFinish={handleFinishRound} 
                onCancel={() => { setActiveTask(null); setCurrentView(AppView.DASHBOARD); }} 
            />
        ) : <div>Erro: Nenhuma tarefa selecionada</div>;
      case AppView.HISTORY:
        if (!canViewHistory) return <div className="p-8 text-center text-red-500">Acesso Negado: Apenas supervisores podem acessar o histórico.</div>;
        return <History logs={logs} onUpdateLog={handleUpdateLog} reportConfig={reportConfig} />;
      case AppView.TEMPLATES:
        if (!canManageTemplates) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
          <TemplateManager 
            templates={templates} 
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
            onCancel={() => setCurrentView(AppView.DASHBOARD)}
          />
        );
      case AppView.USER_MANAGEMENT:
        if (!canManageUsers) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
            <UserManager 
                users={usersList}
                onSave={handleSaveUser}
                onToggleStatus={handleToggleUserStatus}
                onCancel={() => setCurrentView(AppView.DASHBOARD)}
            />
        );
      case AppView.SETTINGS:
        if (!canAccessSettings) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
            <ReportConfigScreen 
                config={reportConfig}
                onSave={handleSaveReportConfig}
                onCancel={() => setCurrentView(AppView.DASHBOARD)}
            />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
             <ShieldCheck className="text-blue-500" size={32} />
             <span className="hidden md:block ml-3 font-bold text-white text-lg tracking-tight">RondaGuard</span>
          </div>
          
          <div className="hidden md:flex px-6 py-4 items-center gap-3 border-b border-slate-800 mb-2">
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize truncate">{user.role.toLowerCase()}</p>
             </div>
          </div>

          <nav className="mt-4 flex flex-col gap-2 px-2 md:px-4">
            <button 
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.DASHBOARD ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:block ml-3 font-medium">Dashboard</span>
            </button>

            {canCreate && (
                <button 
                onClick={handleCreateNewClick}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.CREATE_TASK ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <PlusCircle size={20} />
                <span className="hidden md:block ml-3 font-medium">Nova Tarefa</span>
                </button>
            )}

            {canViewHistory && (
                <button 
                onClick={() => setCurrentView(AppView.HISTORY)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.HISTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <HistoryIcon size={20} />
                <span className="hidden md:block ml-3 font-medium">Histórico</span>
                </button>
            )}

            {canManageTemplates && (
                <button 
                onClick={() => setCurrentView(AppView.TEMPLATES)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.TEMPLATES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <ListChecks size={20} />
                <span className="hidden md:block ml-3 font-medium">Modelos</span>
                </button>
            )}

            {canManageUsers && (
                <button 
                onClick={() => setCurrentView(AppView.USER_MANAGEMENT)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.USER_MANAGEMENT ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <Users size={20} />
                <span className="hidden md:block ml-3 font-medium">Usuários</span>
                </button>
            )}
            
            {canAccessSettings && (
                <button 
                onClick={() => setCurrentView(AppView.SETTINGS)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.SETTINGS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <Settings size={20} />
                <span className="hidden md:block ml-3 font-medium">Configurações</span>
                </button>
            )}
          </nav>
        </div>
        
        <div className="p-4 space-y-2">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center md:justify-start w-full p-3 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="hidden md:block ml-3 font-medium">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start w-full p-3 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={20} />
            <span className="hidden md:block ml-3 font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default App;
    