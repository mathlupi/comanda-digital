import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold text-maroon-700 mb-4">Administração</h1>

      <!-- Abas -->
      <div class="flex border-b mb-4 gap-2">
        <a
          routerLink="/admin/dashboard"
          routerLinkActive="tab-active"
          class="px-4 py-2 tab-inactive rounded-t"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Dashboard
        </a>

        <a
          routerLink="/admin/dishes"
          routerLinkActive="tab-active"
          class="px-4 py-2 tab-inactive rounded-t"
        >
          Pratos cadastrados
        </a>

        <a
          routerLink="/admin/add-dish"
          routerLinkActive="tab-active"
          class="px-4 py-2 tab-inactive rounded-t"
        >
          Cadastrar prato
        </a>
      </div>

      <router-outlet></router-outlet>
    </div>
  `,
})
export class AdminShellComponent {}
