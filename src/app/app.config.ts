import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { provideRouter, Routes, CanActivateFn, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { ClientLoginComponent } from './components/cliente-login/cliente-login.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { MotoboyLoginComponent } from './components/motoboy-login/motoboy-login.component';
import { CozinhaLoginComponent } from './components/cozinha-login/cozinha-login.component';

import { CustomerOrderComponent } from './components/customer-order/customer-order.component';
import { DishListComponent } from './components/dish-list/dish-list.component';
// SEU formulário de cadastro:
import { AdminComponent } from './components/admin/admin.component';
import { KitchenOrderComponent } from './components/kitchen-order/kitchen-order.component';
import { DeliveryOrderComponent } from './components/delivery-order/delivery-order.component';

// NOVO: dashboard e shell
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { AdminShellComponent } from './components/admin/admin-shell.component';

const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const expectedRole = route.data['role'];
  const userRole = sessionStorage.getItem('userRole');
  if (userRole === expectedRole || (expectedRole === 'Client' && !userRole)) {
    return true;
  }
  const redirectPath = userRole
    ? `/${userRole.toLowerCase()}/login`
    : '/client/login';
  return router.createUrlTree([redirectPath]);
};

const routes: Routes = [
  { path: '', redirectTo: '/client/login', pathMatch: 'full' },

  // Logins
  { path: 'client/login', component: ClientLoginComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'motoboy/login', component: MotoboyLoginComponent },
  { path: 'cozinha/login', component: CozinhaLoginComponent },

  // Cliente
  {
    path: 'client/menu',
    component: CustomerOrderComponent,
    data: { role: 'Client' },
    canActivate: [roleGuard],
  },

  // Cozinha e Entregas
  {
    path: 'kitchen',
    component: KitchenOrderComponent,
    data: { role: 'Kitchen' },
    canActivate: [roleGuard],
  },
  {
    path: 'delivery',
    component: DeliveryOrderComponent,
    data: { role: 'Delivery' },
    canActivate: [roleGuard],
  },

  // ADMIN (com layout + filhas)
  {
    path: 'admin',
    component: AdminShellComponent, // ⬅️ layout com abas
    data: { role: 'Admin' },
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // ⬅️ abre dashboard primeiro
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'dishes', component: DishListComponent }, // lista de pratos
      { path: 'add-dish', component: AdminComponent }, // seu formulário de cadastro
      { path: 'edit-dish/:id', component: AdminComponent }, // opcional: reusar form para editar
    ],
  },
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), importProvidersFrom(HttpClientModule)],
};
