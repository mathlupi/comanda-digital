import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

@Component({
  selector: 'app-kitchen-order',
  templateUrl: './kitchen-order.component.html',
  standalone: true,
  imports: [CommonModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
})
export class KitchenOrderComponent implements OnInit {
  activeTab = 'pending';
  orders: Order[] = [];
  inProduction: Order[] = [];
  ready: Order[] = [];
  canceled: Order[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
    setInterval(() => this.loadOrders(), 10000);
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe((orders) => {
      this.orders = orders.filter((o) => o.status === 'Pendente');
      this.inProduction = orders.filter((o) => o.status === 'Em produção');
      this.ready = orders.filter((o) => o.status === 'Pronto');
      this.canceled = orders.filter((o) => o.status === 'Cancelado');
    });
  }

  setStatus(orderId: number, status: string): void {
    const pode =
      (status === 'Em produção' && this.orders.some((o) => o.id === orderId)) ||
      (status === 'Pronto' &&
        this.inProduction.some((o) => o.id === orderId)) ||
      (status === 'Cancelado' &&
        (this.orders.some((o) => o.id === orderId) ||
          this.inProduction.some((o) => o.id === orderId)));

    if (!pode) return;

    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Falha ao atualizar status:', err),
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
