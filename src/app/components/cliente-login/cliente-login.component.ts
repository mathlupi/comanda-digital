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
  selector: 'app-client-login',
  templateUrl: './cliente-login.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterByCategoryPipe],
})
export class ClientLoginComponent {
  users: User[] = [
    {
      username: 'client1',
      password: 'client123',
      role: 'Client',
      redirect: '/client/menu',
    },
  ];
  username: string = 'client1';
  password: string = 'client123';
  errorMessage: string | null = null;

  constructor(private router: Router) {}

  login(): void {
    const user = this.users.find(
      (u) => u.username === this.username && u.password === this.password
    );
    if (user) {
      sessionStorage.setItem('userRole', user.role);
      sessionStorage.setItem('username', this.username); // Armazenar username
      this.router.navigate([user.redirect]);
    } else {
      this.errorMessage = 'Credenciais inválidas';
    }
  }
}
