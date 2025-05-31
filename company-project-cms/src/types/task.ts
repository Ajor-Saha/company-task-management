export type Task = {
  id: string;
  name: string;
  status: 'to-do' | 'in-progress' | 'review' | 'hold' | 'completed';
  description?: string | null;
  endDate?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface UserProps {
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export interface TaskComponentProps extends UserProps {
  tasks: Task[];
  loading: boolean;
}
