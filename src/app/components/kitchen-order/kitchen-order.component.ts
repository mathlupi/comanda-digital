import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kitchen-order',
  templateUrl: './kitchen-order.component.html',
  standalone: true,
  imports: [CommonModule],
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
    // Polling para atualizar pedidos em tempo real
    setInterval(() => this.loadOrders(), 10000);
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe((orders) => {
      this.orders = orders.filter((o) => o.status === 'Pending');
      this.inProduction = orders.filter((o) => o.status === 'In Production');
      this.ready = orders.filter((o) => o.status === 'Ready');
      this.canceled = orders.filter((o) => o.status === 'Canceled');
    });
  }

  setStatus(orderId: number, status: string): void {
    if (
      (status === 'In Production' &&
        this.orders.some((o) => o.id === orderId)) ||
      (status === 'Ready' && this.inProduction.some((o) => o.id === orderId)) ||
      (status === 'Canceled' &&
        (this.orders.some((o) => o.id === orderId) ||
          this.inProduction.some((o) => o.id === orderId)))
    ) {
      this.orderService.updateOrderStatus(orderId, status).subscribe({
        next: () => this.loadOrders(),
        error: (err) => console.error('Falha ao atualizar status:', err),
      });
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
