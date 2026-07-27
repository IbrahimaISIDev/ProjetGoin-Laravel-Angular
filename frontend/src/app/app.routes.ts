import { Routes } from '@angular/router';

import { LoginPage } from './features/auth/pages/login-page/login-page';
import { RegisterPage } from './features/auth/pages/register-page/register-page';
import { TasksPage } from './features/tasks/pages/tasks-page/tasks-page';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'tasks', component: TasksPage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
