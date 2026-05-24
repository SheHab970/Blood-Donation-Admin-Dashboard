import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './Core/Services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit(): void {
    /**
     * If the user refreshes the browser while still logged in,
     * the setTimeout from the previous session is gone.
     * Re-arm it here so the proactive refresh keeps working across reloads.
     */
    if (this.authService.isLoggedIn()) {
      this.authService.scheduleTokenRefresh();
    }
  }
}