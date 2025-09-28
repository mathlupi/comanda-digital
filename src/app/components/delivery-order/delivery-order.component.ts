import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

@Component({
  selector: 'app-delivery-order',
  templateUrl: './delivery-order.component.html',
  standalone: true,
  imports: [CommonModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
})
export class DeliveryOrderComponent implements OnInit, OnDestroy {
  activeTab = 'ready';
  readyOrders: Order[] = [];
  inTransitOrders: Order[] = [];
  deliveredOrders: Order[] = [];
  earnings = 0;
  private pollingInterval: any;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.pollingInterval = setInterval(() => this.loadOrders(), 10000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        const newReadyOrders = orders.filter((o) => o.status === 'Pronto');
        if (newReadyOrders.length > this.readyOrders.length)
          this.notifyNewOrder();
        this.readyOrders = newReadyOrders;
        this.inTransitOrders = orders.filter(
          (o) => o.status === 'Motoboy a caminho'
        );
        this.deliveredOrders = orders.filter((o) => o.status === 'Entregue');
        this.earnings = this.deliveredOrders.length * 5;
      },
      error: (err) => console.error('Erro ao carregar pedidos:', err),
    });
  }

  notifyNewOrder(): void {
    if (Notification.permission === 'granted') {
      new Notification('Novo pedido pronto para entrega!', {
        body: 'Um novo pedido está pronto para ser retirado.',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Novo pedido pronto para entrega!', {
            body: 'Um novo pedido está pronto para ser retirado.',
          });
        }
      });
    }
    alert('Novo pedido pronto para entrega!');
  }

  setStatus(orderId: number, status: string): void {
    const pode =
      (status === 'Motoboy a caminho' &&
        this.readyOrders.some((o) => o.id === orderId)) ||
      (status === 'Entregue' &&
        this.inTransitOrders.some((o) => o.id === orderId));

    if (!pode) {
      alert('Transição de status inválida. O pedido não está na aba correta.');
      return;
    }

    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => this.loadOrders(),
      error: (err) => {
        console.error('Erro ao atualizar status:', err);
        alert(
          'Erro ao atualizar status do pedido. Verifique o console para detalhes.'
        );
      },
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
