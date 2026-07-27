import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import { Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

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

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadTasks();
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

