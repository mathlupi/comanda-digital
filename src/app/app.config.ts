import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { provideRouter, Routes, CanActivateFn, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ClientLoginComponent } from './components/cliente-login/cliente-login.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { MotoboyLoginComponent } from './components/motoboy-login/motoboy-login.component';
import { CozinhaLoginComponent } from './components/cozinha-login/cozinha-login.component';
import { CustomerOrderComponent } from './components/customer-order/customer-order.component';
import { DishListComponent } from './components/dish-list/dish-list.component';
import { DishFormComponent } from './components/dish-form/dish-form.component';
import { KitchenOrderComponent } from './components/kitchen-order/kitchen-order.component';
import { DeliveryOrderComponent } from './components/delivery-order/delivery-order.component';

const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const expectedRole = route.data['role'];
  const userRole = sessionStorage.getItem('userRole');
  console.log(
    'RoleGuard: Expected role:',
    expectedRole,
    'User role:',
    userRole ?? 'null',
    'Path:',
    route.routeConfig?.path,
    'State URL:',
    state.url,
    'SessionStorage:',
    sessionStorage
  );
  if (userRole === expectedRole || (expectedRole === 'Client' && !userRole)) {
    console.log('RoleGuard: Access granted');
    return true;
  }
  console.log('RoleGuard: Access denied, redirecting to login');
  const redirectPath = userRole
    ? `/${userRole.toLowerCase()}/login`
    : '/client/login';
  console.log('RoleGuard: Redirecting to:', redirectPath);
  return router.createUrlTree([redirectPath]);
};

const routes: Routes = [
  { path: '', redirectTo: '/client/login', pathMatch: 'full' },
  { path: 'client/login', component: ClientLoginComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'motoboy/login', component: MotoboyLoginComponent },
  { path: 'cozinha/login', component: CozinhaLoginComponent },
  {
    path: 'client/menu',
    component: CustomerOrderComponent,
    data: { role: 'Client' },
    canActivate: [roleGuard],
  },
  {
    path: 'admin',
    component: DishListComponent,
    data: { role: 'Admin' },
    canActivate: [roleGuard],
  },
  {
    path: 'admin/add-dish',
    component: DishFormComponent,
    data: { role: 'Admin' },
    canActivate: [roleGuard],
  },
  {
    path: 'admin/edit-dish/:id',
    component: DishFormComponent,
    data: { role: 'Admin' },
    canActivate: [roleGuard],
  },
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
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), importProvidersFrom(HttpClientModule)],
};
