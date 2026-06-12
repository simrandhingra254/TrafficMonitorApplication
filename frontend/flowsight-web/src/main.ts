import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { API_BASE_URL } from './app/services/tokens';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
  ],
}).catch((err) => console.error(err));
