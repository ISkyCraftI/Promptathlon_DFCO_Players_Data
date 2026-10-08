import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from "@angular/router";
import { providePrimeNG } from "primeng/config";
import { routes } from "./app.routes";
import { GlobalErrorHandler } from "./shared/global-error-handler";
import { errorInterceptor } from "./shared/interceptors/error-interceptor";
import { EasyfootPreset } from "./theme/easyfoot.preset";

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: "enabled" })),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: LOCALE_ID, useValue: "fr-FR" },
    provideHttpClient(withInterceptors([errorInterceptor])),
    providePrimeNG({
      ripple: false,
      theme: { preset: EasyfootPreset, options: { darkModeSelector: ".app-dark", cssLayer: false } },
      translation: {
        emptyMessage: "Aucun résultat", emptySearchMessage: "Aucun joueur trouvé", accept: "Oui", reject: "Non",
        dayNamesMin: ["D", "L", "M", "M", "J", "V", "S"],
      },
    }),
  ],
};
