import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-order',
  templateUrl: './delivery-order.component.html',
  standalone: true,
  imports: [CommonModule],
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
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        console.log('Pedidos recebidos:', orders); // Debug log
        const newReadyOrders = orders.filter((o) => o.status === 'Ready');
        if (newReadyOrders.length > this.readyOrders.length) {
          this.notifyNewOrder();
        }
        this.readyOrders = newReadyOrders;
        this.inTransitOrders = orders.filter(
          (o) => o.status === 'Motoboy a Caminho'
        );
        this.deliveredOrders = orders.filter((o) => o.status === 'Delivered');
        this.earnings = this.deliveredOrders.length * 5;
        console.log('Ready:', this.readyOrders); // Debug log
        console.log('In Transit:', this.inTransitOrders); // Debug log
        console.log('Delivered:', this.deliveredOrders); // Debug log
      },
      error: (err) => console.error('Erro ao carregar pedidos:', err),
    });
  }

  notifyNewOrder(): void {
    console.log('Notificando novo pedido pronto'); // Debug log
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
    console.log(`Tentando atualizar pedido ${orderId} para status ${status}`); // Debug log
    if (
      (status === 'Motoboy a Caminho' &&
        this.readyOrders.some((o) => o.id === orderId)) ||
      (status === 'Delivered' &&
        this.inTransitOrders.some((o) => o.id === orderId))
    ) {
      this.orderService.updateOrderStatus(orderId, status).subscribe({
        next: (updatedOrder) => {
          console.log('Status atualizado com sucesso:', updatedOrder); // Debug log
          this.loadOrders(); // Reload orders to reflect status change
        },
        error: (err) => {
          console.error('Erro ao atualizar status:', err); // Debug log
          alert(
            'Erro ao atualizar status do pedido. Verifique o console para detalhes.'
          );
        },
      });
    } else {
      console.warn(
        `Transição de status inválida para o pedido ${orderId}: ${status}`
      ); // Debug log
      alert('Transição de status inválida. O pedido não está na aba correta.');
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
