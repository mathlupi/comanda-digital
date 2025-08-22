import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  username: string;
  password: string;
  role: string;
  redirect: string;
}

@Component({
  selector: 'app-motoboy-login',
  templateUrl: './motoboy-login.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MotoboyLoginComponent {
  users: User[] = [
    {
      username: 'motoboy1',
      password: 'motoboy123',
      role: 'Delivery',
      redirect: '/delivery',
    },
  ];
  username: string = 'motoboy1';
  password: string = 'motoboy123';
  errorMessage: string | null = null;

  constructor(private router: Router) {}

  login(): void {
    const user = this.users.find(
      (u) => u.username === this.username && u.password === this.password
    );
    if (user) {
      sessionStorage.setItem('userRole', user.role);
      this.router.navigate([user.redirect]);
    } else {
      this.errorMessage = 'Credenciais inválidas';
    }
  }
}
