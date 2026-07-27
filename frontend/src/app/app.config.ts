import { APP_INITIALIZER, ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

function initializeAuth() {
  const authService = inject(AuthService);
  return () => authService.loadCurrentUser();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
  ],
};
