import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OrderService,
  Order,
  DishIngredients,
} from '../../services/order.service';
import { DishService, Dish } from '../../services/dish.service';

@Component({
  selector: 'app-kitchen-order',
  templateUrl: './kitchen-order.component.html',
  standalone: true,
  imports: [CommonModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
})
export class KitchenOrderComponent implements OnInit {
  activeTab = 'pending';

  // ViewModels com itens resolvidos:
  orders: OrderVM[] = [];
  inProduction: OrderVM[] = [];
  ready: OrderVM[] = [];
  canceled: OrderVM[] = [];

  private dishById = new Map<number, Dish>();
  private dishesLoaded = false;

  constructor(
    private orderService: OrderService,
    private dishService: DishService
  ) {}

  ngOnInit(): void {
    // Carrega pratos uma vez e só então começa a puxar pedidos (polling)
    this.dishService.getDishes().subscribe({
      next: (dishes) => {
        this.dishById = new Map(dishes.map((d) => [d.id, d]));
        this.dishesLoaded = true;
        this.loadOrders();
        setInterval(() => this.loadOrders(), 10000);
      },
      error: (err) => console.error('Falha ao carregar pratos:', err),
    });
  }

  loadOrders(): void {
    if (!this.dishesLoaded) return;

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        const vms = orders.map((o) => this.enrichOrder(o));
        this.orders = vms.filter((o) => o.status === 'Pendente');
        this.inProduction = vms.filter((o) => o.status === 'Em produção');
        this.ready = vms.filter((o) => o.status === 'Pronto');
        this.canceled = vms.filter((o) => o.status === 'Cancelado');
      },
      error: (err) => console.error('Falha ao carregar pedidos:', err),
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

  // ----- Helpers -----
  private enrichOrder(order: Order): OrderVM {
    const items: OrderItemVM[] = [];

    for (let i = 0; i < order.dishIds.length; i++) {
      const dishId = order.dishIds[i];
      const quantity = order.quantities[i] ?? 1;
      const dish = this.dishById.get(dishId);
      if (!dish) continue; // evita quebrar a UI se houver id inválido

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

    return { ...order, items };
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
};
