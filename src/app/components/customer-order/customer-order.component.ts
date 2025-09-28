import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterByCategoryPipe } from '../../pipes/filter-by-category.pipe';

registerLocaleData(localePt);

interface CartItem {
  dish: Dish;
  quantity: number;
  selectedIngredients: string[];
}

@Component({
  selector: 'app-customer-order',
  templateUrl: './customer-order.component.html',
  styleUrls: ['./customer-order.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, FilterByCategoryPipe],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
})
export class CustomerOrderComponent implements OnInit, OnDestroy {
  activeTab = 'menu';
  menuCategory: Dish['category'] = 'Pratos';
  dishes: Dish[] = [];
  cart: CartItem[] = [];
  quantities: { [key: number]: number } = {};
  selectedIngredients: { [key: number]: { [ingredient: string]: boolean } } =
    {};
  customerName: string = sessionStorage.getItem('username') || '';
  customerAddress: string = '';
  orderStatus: string | null = null;
  errorMessage: string | null = null;
  showTracking = false;
  currentOrderId: number | null = null;
  orderHistory: Order[] = [];
  private pollingInterval: any;

  constructor(
    private dishService: DishService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'Client') {
      this.router.navigate(['/client/login']);
      return;
    }
    this.loadDishes();
    this.loadOrderHistory();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  private normalizeCategory(cat: string): Dish['category'] {
    switch (cat) {
      case 'Main Course':
        return 'Pratos';
      case 'Drink':
        return 'Bebidas';
      case 'Dessert':
        return 'Sobremesas';
      default:
        return cat as Dish['category'];
    }
  }

  loadDishes(): void {
    this.dishService.getDishes().subscribe({
      next: (data: Dish[]) => {
        // Normaliza categoria e garante ingredients string
        this.dishes = data.map((d) => ({
          ...d,
          category: this.normalizeCategory(d.category),
          ingredients: d.ingredients || '',
        }));

        // Inicializa quantidades e ingredientes selecionados
        this.dishes.forEach((dish) => {
          this.quantities[dish.id] = 1;
          this.selectedIngredients[dish.id] = {};
          this.getIngredientsArray(dish).forEach((ing) => {
            this.selectedIngredients[dish.id][ing] = true;
          });
        });
      },
      error: () =>
        (this.errorMessage = 'Falha ao carregar o menu. Tente novamente.'),
    });
  }

  getIngredientsArray(dish: Dish): string[] {
    return dish.ingredients
      ? dish.ingredients
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean)
      : [];
  }

  loadOrderHistory(): void {
    if (!this.customerName) return;
    this.orderService.getOrdersByCustomerName(this.customerName).subscribe({
      next: (orders) => (this.orderHistory = orders),
    });
  }

  updateIngredientSelection(
    dishId: number,
    ingredient: string,
    checked: boolean
  ): void {
    if (!this.selectedIngredients[dishId])
      this.selectedIngredients[dishId] = {};
    this.selectedIngredients[dishId][ingredient] = checked;
  }

  addToCart(dish: Dish): void {
    if (!this.quantities[dish.id] || this.quantities[dish.id] <= 0) {
      this.errorMessage = 'Selecione uma quantidade válida.';
      return;
    }
    const selected = Object.keys(this.selectedIngredients[dish.id]).filter(
      (k) => this.selectedIngredients[dish.id][k]
    );
    const existing = this.cart.find(
      (it) =>
        it.dish.id === dish.id &&
        JSON.stringify(it.selectedIngredients) === JSON.stringify(selected)
    );
    if (existing) existing.quantity += this.quantities[dish.id];
    else
      this.cart.push({
        dish,
        quantity: this.quantities[dish.id],
        selectedIngredients: selected,
      });
    this.quantities[dish.id] = 1;
    this.errorMessage = null;
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }
  updateQuantity(index: number, q: number): void {
    q <= 0 ? this.removeFromCart(index) : (this.cart[index].quantity = q);
  }
  getTotalPrice(): number {
    return this.cart.reduce((t, it) => t + it.dish.price * it.quantity, 0);
  }
  getCartCount(): number {
    return this.cart.reduce((sum, it) => sum + it.quantity, 0);
  }

  confirmPayment(): void {
    if (confirm('Confirmar pagamento do pedido?')) this.placeOrder();
  }

  placeOrder(): void {
    if (!this.customerName || !this.customerAddress) {
      this.errorMessage = 'Por favor, insira seu nome e endereço.';
      return;
    }
    if (this.cart.length === 0) {
      this.errorMessage = 'Seu carrinho está vazio.';
      return;
    }
    const order: Order = {
      customerName: this.customerName,
      customerAddress: this.customerAddress,
      totalPrice: this.getTotalPrice(),
      status: 'Pendente',
      dishIds: this.cart.map((i) => i.dish.id),
      quantities: this.cart.map((i) => i.quantity),
      selectedIngredients: this.cart.map((i) => ({
        dishId: i.dish.id,
        ingredients: i.selectedIngredients,
      })),
    };

    this.orderService.createOrder(order).subscribe({
      next: (newOrder) => {
        this.cart = [];
        this.orderStatus = newOrder.status;
        this.currentOrderId = newOrder.id ?? null;
        this.showTracking = true;
        this.errorMessage = null;
        this.setActiveTab('track');
        this.loadOrderHistory();
        this.pollingInterval = setInterval(() => {
          this.orderService.getOrder(newOrder.id!).subscribe({
            next: (u) => {
              this.orderStatus = u.status;
              if (u.status === 'Entregue') {
                clearInterval(this.pollingInterval);
                this.loadOrderHistory();
              }
            },
          });
        }, 10000);
      },
      error: (err) =>
        (this.errorMessage = `Falha ao fazer pedido: ${err.message}`),
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  setMenuCategory(category: Dish['category']): void {
    this.menuCategory = category;
  }

  onImageError(dish: Dish): void {
    (dish as any).imageUrl = '';
  }
}
