export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  dueDate: string;
  fileName?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  file?: File | null;
}
