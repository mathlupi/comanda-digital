import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterByCategoryPipe } from '../../pipes/filter-by-category.pipe';

interface User {
  username: string;
  password: string;
  role: string;
  redirect: string;
}

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterByCategoryPipe],
})
export class AdminLoginComponent {
  users: User[] = [
    {
      username: 'admin1',
      password: 'admin123',
      role: 'Admin',
      redirect: '/admin',
    },
  ];
  username: string = 'admin1';
  password: string = 'admin123';
  errorMessage: string | null = null;

  constructor(private router: Router) {}

  login(): void {
    console.log('AdminLogin: Attempting login with:', {
      username: this.username,
    }); // Debug log
    const user = this.users.find(
      (u) => u.username === this.username && u.password === this.password
    );
    if (user) {
      console.log('AdminLogin: Login successful, setting userRole:', user.role);
      sessionStorage.setItem('userRole', user.role);
      sessionStorage.setItem('username', this.username);
      console.log('AdminLogin: SessionStorage after login:', sessionStorage);
      console.log('AdminLogin: Navigating to:', user.redirect);
      this.router.navigate([user.redirect]).then((success) => {
        console.log('AdminLogin: Navigation success:', success);
      });
    } else {
      this.errorMessage = 'Credenciais inválidas';
      console.log('AdminLogin: Login failed: Invalid credentials');
    }
  }
}
