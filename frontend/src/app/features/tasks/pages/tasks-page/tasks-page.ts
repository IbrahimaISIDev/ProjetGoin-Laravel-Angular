import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import { Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

type TaskFilter = 'all' | 'active' | 'done';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.scss',
})
export class TasksPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  public readonly authService = inject(AuthService);
  private readonly tasksService = inject(TasksService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(false);
  readonly filter = signal<TaskFilter>('all');

  readonly summary = computed(() => {
    const all = this.tasks();
    const done = all.filter((task) => task.is_done).length;
    return { total: all.length, done, active: all.length - done };
  });

  readonly filteredTasks = computed(() => {
    const all = this.tasks();
    switch (this.filter()) {
      case 'active':
        return all.filter((task) => !task.is_done);
      case 'done':
        return all.filter((task) => task.is_done);
      default:
        return all;
    }
  });

  readonly skeletonPlaceholders = [0, 1, 2];

  readonly editingTaskId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  setFilter(filter: TaskFilter): void {
    this.filter.set(filter);
  }

  startEdit(task: Task): void {
    this.confirmingDeleteId.set(null);
    this.editingTaskId.set(task.id);
    this.editForm.setValue({
      title: task.title,
      description: task.description ?? '',
    });
  }

  cancelEdit(): void {
    this.editingTaskId.set(null);
  }

  saveEdit(task: Task): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.tasksService.update(task.id, this.editForm.getRawValue()).subscribe({
      next: () => {
        this.editingTaskId.set(null);
        this.loadTasks();
        this.toastService.success('Tâche modifiée', 'Vos changements ont été enregistrés');
      },
      error: () => {
        this.toastService.error('Erreur de modification', 'Impossible de modifier cette tâche');
      },
    });
  }

  askDelete(task: Task): void {
    this.editingTaskId.set(null);
    this.confirmingDeleteId.set(task.id);
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
  }

  loadTasks(): void {
    this.loading.set(true);

    this.tasksService.list().subscribe({
      next: (response) => {
        this.tasks.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Erreur de chargement', 'Impossible de charger vos tâches');
      },
    });
  }

  createTask(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.tasksService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset({ title: '', description: '' });
        this.loadTasks();
        this.toastService.success('Tâche créée', 'Votre nouvelle tâche a été ajoutée');
      },
      error: () => {
        this.toastService.error('Erreur de création', 'Impossible de créer cette tâche');
      },
    });
  }

  toggleTask(task: Task): void {
    this.tasksService
      .update(task.id, {
        title: task.title,
        description: task.description,
        is_done: !task.is_done,
      })
      .subscribe({
        next: () => {
          this.loadTasks();
          const message = task.is_done ? 'Tâche marquée comme non terminée' : 'Tâche terminée !';
          this.toastService.success('Mise à jour réussie', message);
        },
        error: () => {
          this.toastService.error('Erreur de mise à jour', 'Impossible de modifier cette tâche');
        },
      });
  }

  deleteTask(id: number): void {
    this.tasksService.remove(id).subscribe({
      next: () => {
        this.confirmingDeleteId.set(null);
        this.loadTasks();
        this.toastService.success('Tâche supprimée', 'La tâche a été supprimée avec succès');
      },
      error: () => {
        this.toastService.error('Erreur de suppression', 'Impossible de supprimer cette tâche');
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.info('Déconnexion', 'À bientôt !');
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.router.navigateByUrl('/login');
      },
    });
  }
}

