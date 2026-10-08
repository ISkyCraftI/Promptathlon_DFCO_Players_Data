import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { providePrimeNG } from "primeng/config";
import { routes } from "./app.routes";
import { errorInterceptor } from "./shared/interceptors/error-interceptor";
import { GlobalErrorHandler } from "./shared/global-error-handler";
import { EasyfootPreset } from "./theme/easyfoot.preset";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideHttpClient(
      withInterceptors([errorInterceptor])
    ),
    providePrimeNG({
      theme: {
        preset: EasyfootPreset,
        options: {
          darkModeSelector: ".app-dark",
        },
      },
    }),
  ],
};
