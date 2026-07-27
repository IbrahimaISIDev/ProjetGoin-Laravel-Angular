import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';

import { User } from './user.model';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadCurrentUser(): Promise<User | null> {
    return firstValueFrom(
      this.http.get<User>('/api/me').pipe(
        tap((user) => this.currentUserSignal.set(user)),
        catchError(() => {
          this.currentUserSignal.set(null);
          return of(null);
        }),
      ),
    );
  }

  csrf() {
    return this.http.get('/sanctum/csrf-cookie');
  }

  register(payload: RegisterPayload) {
    return this.csrf().pipe(
      switchMap(() => this.http.post<User>('/api/register', payload)),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  login(payload: LoginPayload) {
    return this.csrf().pipe(
      switchMap(() => this.http.post<User>('/api/login', payload)),
      tap((user) => this.currentUserSignal.set(user)),
    );
  }

  logout() {
    return this.http.post('/api/logout', {}).pipe(
      tap(() => this.currentUserSignal.set(null)),
    );
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
