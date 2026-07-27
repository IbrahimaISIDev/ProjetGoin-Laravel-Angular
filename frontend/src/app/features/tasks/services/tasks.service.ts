import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { PaginatedResponse, Task } from '../models/task.model';

interface TaskPayload {
  title: string;
  description?: string | null;
  is_done?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<PaginatedResponse<Task>>('/api/tasks');
  }

  create(payload: TaskPayload) {
    return this.http.post<Task>('/api/tasks', payload);
  }

  update(id: number, payload: TaskPayload) {
    return this.http.put<Task>(`/api/tasks/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }
}

