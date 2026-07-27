import { Injectable, signal } from '@angular/core';
import { ToastNotification, ToastType } from './toast-notification.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<ToastNotification[]>([]);
  readonly toastsSignal = this.toasts.asReadonly();

  show(
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 4000
  ): void {
    const id = this.generateId();
    const toast: ToastNotification = { id, type, title, message, duration };
    
    this.toasts.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    this.show('success', title, message, duration);
  }

  error(title: string, message?: string, duration?: number): void {
    this.show('error', title, message, duration);
  }

  warning(title: string, message?: string, duration?: number): void {
    this.show('warning', title, message, duration);
  }

  info(title: string, message?: string, duration?: number): void {
    this.show('info', title, message, duration);
  }

  dismiss(id: string): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }

  dismissAll(): void {
    this.toasts.set([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
