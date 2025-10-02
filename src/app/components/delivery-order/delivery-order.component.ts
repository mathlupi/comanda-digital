import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OrderService,
  Order,
  DishIngredients,
} from '../../services/order.service';
import { DishService, Dish } from '../../services/dish.service';

@Component({
  selector: 'app-delivery-order',
  templateUrl: './delivery-order.component.html',
  standalone: true,
  imports: [CommonModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
})
export class DeliveryOrderComponent implements OnInit, OnDestroy {
  activeTab = 'ready';

  // ViewModels com itens resolvidos:
  readyOrders: OrderVM[] = [];
  inTransitOrders: OrderVM[] = [];
  deliveredOrders: OrderVM[] = [];
  earnings = 0;

  private pollingInterval: any;
  private dishById = new Map<number, Dish>();
  private dishesLoaded = false;

  constructor(
    private orderService: OrderService,
    private dishService: DishService
  ) {}

  ngOnInit(): void {
    // Carrega os pratos uma única vez para mapear dishId -> Dish
    this.dishService.getDishes().subscribe({
      next: (dishes) => {
        this.dishById = new Map(dishes.map((d) => [d.id, d]));
        this.dishesLoaded = true;
        this.loadOrders();
        this.pollingInterval = setInterval(() => this.loadOrders(), 10000);
      },
      error: (err) => console.error('Erro ao carregar pratos:', err),
    });
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  loadOrders(): void {
    if (!this.dishesLoaded) return;

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        const vms = orders.map((o) => this.enrichOrder(o));
        const newReady = vms.filter((o) => o.status === 'Pronto');

        // Notificação quando chegar pedido novo na aba "Prontos"
        if (newReady.length > this.readyOrders.length) this.notifyNewOrder();

        this.readyOrders = newReady;
        this.inTransitOrders = vms.filter(
          (o) => o.status === 'Motoboy a caminho'
        );
        this.deliveredOrders = vms.filter((o) => o.status === 'Entregue');

        // Ex.: taxa fixa de R$5 por entrega concluída (ajuste conforme sua regra)
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

  // ----- Helpers de projeção -----
  private enrichOrder(order: Order): OrderVM {
    const items: OrderItemVM[] = [];

    for (let i = 0; i < order.dishIds.length; i++) {
      const dishId = order.dishIds[i];
      const quantity = order.quantities[i] ?? 1;
      const dish = this.dishById.get(dishId);
      if (!dish) continue;

      const sel: DishIngredients | undefined = order.selectedIngredients?.find(
        (s) => s.dishId === dishId
      );

      items.push({
        dish,
        quantity,
        ingredients: sel?.ingredients?.length
          ? sel.ingredients
          : this.splitIngredients(dish.ingredients),
        customized: !!sel?.ingredients?.length,
      });
    }

    const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);

    return { ...order, items, totalItems };
  }

  private splitIngredients(ing: string | undefined): string[] {
    if (!ing) return [];
    return ing
      .split(/[,;/\n]/g)
      .map((s) => s.trim())
      .filter((s) => !!s);
  }

  trackByOrder = (_: number, o: OrderVM) => o.id;
  trackByItem = (_: number, it: OrderItemVM) =>
    `${it.dish.id}-${it.quantity}-${it.customized}`;
}

// ---- ViewModels ----
export type OrderItemVM = {
  dish: Dish;
  quantity: number;
  ingredients: string[];
  customized: boolean;
};

export type OrderVM = Order & {
  items: OrderItemVM[];
  totalItems: number;
};
