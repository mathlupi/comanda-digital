import { Component, OnInit, OnDestroy } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import {
  OrderService,
  Order,
  DishIngredients,
} from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterByCategoryPipe } from '../../pipes/filter-by-category.pipe';

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
})
export class CustomerOrderComponent implements OnInit, OnDestroy {
  activeTab = 'menu';
  menuCategory = 'Main Course';
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
    console.log('CustomerOrderComponent: User role:', userRole ?? 'null');
    if (userRole !== 'Client') {
      console.log('CustomerOrderComponent: Redirecting to /client/login');
      this.router.navigate(['/client/login']);
      return;
    }
    this.loadDishes();
    this.loadOrderHistory();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadDishes(): void {
    this.dishService.getDishes().subscribe({
      next: (data: Dish[]) => {
        this.dishes = data.map((dish) => ({
          ...dish,
          ingredients: dish.ingredients || '', // Ensure ingredients is never null
        }));
        console.log('CustomerOrderComponent: Dishes loaded:', data);
        this.dishes.forEach((dish) => {
          this.quantities[dish.id] = 1;
          this.selectedIngredients[dish.id] = {};
          const ingredients = this.getIngredientsArray(dish);
          ingredients.forEach((ingredient) => {
            this.selectedIngredients[dish.id][ingredient] = true;
          });
          if (dish.imageUrl) {
            console.log(
              'CustomerOrderComponent: Image URL for',
              dish.name,
              ':',
              dish.imageUrl
            );
            const img = new Image();
            img.src = dish.imageUrl;
            img.onload = () =>
              console.log(
                'CustomerOrderComponent: Image loaded successfully:',
                dish.imageUrl
              );
            img.onerror = () =>
              console.error(
                'CustomerOrderComponent: Failed to load image:',
                dish.imageUrl
              );
          }
        });
      },
      error: (err) => {
        console.error('CustomerOrderComponent: Falha ao carregar pratos:', err);
        this.errorMessage = 'Falha ao carregar o menu. Tente novamente.';
      },
    });
  }

  getIngredientsArray(dish: Dish): string[] {
    return dish.ingredients
      ? dish.ingredients
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i)
      : [];
  }

  loadOrderHistory(): void {
    if (this.customerName) {
      this.orderService.getOrdersByCustomerName(this.customerName).subscribe({
        next: (orders) => {
          this.orderHistory = orders;
          console.log('CustomerOrderComponent: Histórico de pedidos:', orders);
        },
        error: (err) =>
          console.error(
            'CustomerOrderComponent: Erro ao carregar histórico:',
            err
          ),
      });
    }
  }

  updateIngredientSelection(
    dishId: number,
    ingredient: string,
    checked: boolean
  ): void {
    console.log('CustomerOrderComponent: Updating ingredient:', {
      dishId,
      ingredient,
      checked,
    });
    if (!this.selectedIngredients[dishId]) {
      this.selectedIngredients[dishId] = {};
    }
    this.selectedIngredients[dishId][ingredient] = checked;
  }

  addToCart(dish: Dish): void {
    if (!this.quantities[dish.id] || this.quantities[dish.id] <= 0) {
      this.errorMessage = 'Selecione uma quantidade válida.';
      return;
    }
    const selected = Object.keys(this.selectedIngredients[dish.id]).filter(
      (ingredient) => this.selectedIngredients[dish.id][ingredient]
    );
    const cartItem = this.cart.find(
      (item) =>
        item.dish.id === dish.id &&
        JSON.stringify(item.selectedIngredients) === JSON.stringify(selected)
    );
    if (cartItem) {
      cartItem.quantity += this.quantities[dish.id];
    } else {
      this.cart.push({
        dish,
        quantity: this.quantities[dish.id],
        selectedIngredients: selected,
      });
    }
    console.log('CustomerOrderComponent: Added to cart:', {
      dish: dish.name,
      quantity: this.quantities[dish.id],
      selectedIngredients: selected,
    });
    this.quantities[dish.id] = 1;
    this.errorMessage = null;
  }

  removeFromCart(index: number): void {
    console.log(
      'CustomerOrderComponent: Removing from cart:',
      this.cart[index].dish.name
    );
    this.cart.splice(index, 1);
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(index);
    } else {
      this.cart[index].quantity = quantity;
      console.log(
        'CustomerOrderComponent: Updated quantity for',
        this.cart[index].dish.name,
        'to',
        quantity
      );
    }
  }

  getTotalPrice(): number {
    return this.cart.reduce(
      (total, item) => total + item.dish.price * item.quantity,
      0
    );
  }

  confirmPayment(): void {
    if (confirm('Confirmar pagamento do pedido?')) {
      this.placeOrder();
    }
  }

  placeOrder(): void {
    if (!this.customerName || !this.customerAddress) {
      this.errorMessage = 'Por favor, insira seu nome e endereço.';
      console.error('CustomerOrderComponent: Nome ou endereço ausente:', {
        customerName: this.customerName,
        customerAddress: this.customerAddress,
      });
      return;
    }
    if (this.cart.length === 0) {
      this.errorMessage = 'Seu carrinho está vazio.';
      console.error('CustomerOrderComponent: Carrinho vazio');
      return;
    }
    const order: Order = {
      customerName: this.customerName,
      customerAddress: this.customerAddress,
      totalPrice: this.getTotalPrice(),
      status: 'Pending',
      dishIds: this.cart.map((item) => item.dish.id),
      quantities: this.cart.map((item) => item.quantity),
      selectedIngredients: this.cart.map((item) => ({
        dishId: item.dish.id,
        ingredients: item.selectedIngredients,
      })),
    };
    console.log('CustomerOrderComponent: Creating order:', order);
    this.orderService.createOrder(order).subscribe({
      next: (newOrder) => {
        console.log(
          'CustomerOrderComponent: Pedido criado com sucesso:',
          newOrder
        );
        this.cart = [];
        this.orderStatus = newOrder.status;
        this.currentOrderId = newOrder.id ?? null;
        this.showTracking = true;
        this.errorMessage = null;
        this.setActiveTab('track');
        this.loadOrderHistory();
        this.pollingInterval = setInterval(() => {
          this.orderService.getOrder(newOrder.id!).subscribe({
            next: (updatedOrder) => {
              this.orderStatus = updatedOrder.status;
              console.log(
                'CustomerOrderComponent: Updated order status:',
                updatedOrder.status
              );
              if (updatedOrder.status === 'Delivered') {
                clearInterval(this.pollingInterval);
                this.loadOrderHistory();
              }
            },
            error: (err) =>
              console.error(
                'CustomerOrderComponent: Falha ao buscar status do pedido:',
                err
              ),
          });
        }, 10000);
      },
      error: (err) => {
        console.error('CustomerOrderComponent: Falha ao criar pedido:', err);
        this.errorMessage = `Falha ao fazer pedido: ${err.status} - ${
          err.message || 'Erro desconhecido'
        }`;
      },
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('CustomerOrderComponent: Active tab set to:', tab);
  }

  setMenuCategory(category: string): void {
    this.menuCategory = category;
    console.log('CustomerOrderComponent: Menu category set to:', category);
  }

  onImageError(dish: Dish): void {
    console.error(
      'CustomerOrderComponent: Failed to load image for dish:',
      dish.name,
      'URL:',
      dish.imageUrl
    );
  }
}
