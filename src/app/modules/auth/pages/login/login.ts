import { Component, inject } from '@angular/core';
import {
  FormsModule,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../Core/Services/auth';
import { LoginRequest } from '../../../../Core/interface/api-models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    CommonModule,
    InputTextModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);

  passwordVisibility = false;
  isLoading = false;

  loginForm = this.formBuilder.group({
    userName: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const credentials: LoginRequest = {
      Email: this.loginForm.value.userName!,
      Password: this.loginForm.value.password!,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Welcome',
          detail: 'Logged in successfully',
          life: 2000,
        });

        this.router.navigate(['/dashboard/home']);
      },
      error: (err) => {
        this.isLoading = false;
        const detail =
          err?.error?.message ?? 'Invalid email or password. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail,
          life: 4000,
        });
      },
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisibility = !this.passwordVisibility;
  }

  // Convenience getters for template validation
  get emailInvalid(): boolean {
    const ctrl = this.loginForm.get('userName');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get passwordInvalid(): boolean {
    const ctrl = this.loginForm.get('password');
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
