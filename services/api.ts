import {
  Task,
  RoundLog,
  ChecklistTemplate,
  User,
  ReportConfig,
} from "../types";

const API_URL = "https://api-rondaguard.devtiburcio.cloud/api";

// Helper para tratar respostas
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(error.error || `Erro HTTP: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`);
    return handleResponse(res);
  },

  saveUser: async (user: User): Promise<void> => {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return handleResponse(res);
  },

  toggleUserStatus: async (userId: string, active: boolean): Promise<void> => {
    const res = await fetch(`${API_URL}/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    return handleResponse(res);
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${API_URL}/tasks`);
    return handleResponse(res);
  },

  saveTask: async (task: Task): Promise<void> => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return handleResponse(res);
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  // Templates
  getTemplates: async (): Promise<ChecklistTemplate[]> => {
    const res = await fetch(`${API_URL}/templates`);
    return handleResponse(res);
  },

  saveTemplate: async (template: ChecklistTemplate): Promise<void> => {
    const res = await fetch(`${API_URL}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    return handleResponse(res);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/templates/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  // Rounds / History
  getRounds: async (): Promise<RoundLog[]> => {
    const res = await fetch(`${API_URL}/rounds`);
    return handleResponse(res);
  },

  saveRound: async (log: RoundLog): Promise<void> => {
    const res = await fetch(`${API_URL}/rounds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
    return handleResponse(res);
  },

  // Settings
  getSettings: async (): Promise<ReportConfig> => {
    const res = await fetch(`${API_URL}/settings`);
    return handleResponse(res);
  },

  saveSettings: async (config: ReportConfig): Promise<void> => {
    const res = await fetch(`${API_URL}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return handleResponse(res);
  },
};
