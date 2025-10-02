import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterByCategoryPipe } from '../../pipes/filter-by-category.pipe';

registerLocaleData(localePt);

interface ItemCarrinho {
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
  // Estado de navegação
  activeTab = 'menu';
  menuCategory: Dish['category'] = 'Pratos';

  // Dados do menu e carrinho
  dishes: Dish[] = [];
  cart: ItemCarrinho[] = [];
  quantities: { [key: number]: number } = {};
  selectedIngredients: { [key: number]: { [ingredient: string]: boolean } } =
    {};

  // Dados do cliente e pedido
  customerName: string = sessionStorage.getItem('username') || '';
  customerAddress: string = '';
  orderStatus: string | null = null;
  showTracking = false;
  currentOrderId: number | null = null;

  // Histórico e mensagens
  orderHistory: Order[] = [];
  errorMessage: string | null = null;

  // Polling
  private pollingInterval: any;

  // Linha do tempo (stepper)
  private readonly ORDEM_ETAPAS = [
    'Pendente', // 0 - Pedido feito
    'Em produção', // 1
    'Pronto', // 2
    'Aguardando motoboy', // 3 (visual - deriva de "Pronto")
    'Motoboy a caminho', // 4
    'Entregue', // 5
  ] as const;

  historicoStatus: Array<{ status: string; at: Date }> = [];

  constructor(
    private dishService: DishService,
    private orderService: OrderService,
    private router: Router
  ) {}

  // ===== Ciclo de vida =====
  ngOnInit(): void {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'Client') {
      this.router.navigate(['/client/login']);
      return;
    }
    this.carregarCardapio();
    this.carregarHistoricoPedidos();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  // ===== Normalizações =====
  private normalizarCategoria(cat: string): Dish['category'] {
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

  // ===== Cardápio =====
  carregarCardapio(): void {
    this.dishService.getDishes().subscribe({
      next: (data: Dish[]) => {
        this.dishes = data.map((d) => ({
          ...d,
          category: this.normalizarCategoria(d.category),
          ingredients: d.ingredients || '',
        }));

        // Inicializa quantidades e seleção de ingredientes
        this.dishes.forEach((dish) => {
          this.quantities[dish.id] = 1;
          this.selectedIngredients[dish.id] = {};
          this.obterIngredientesArray(dish).forEach((ing) => {
            this.selectedIngredients[dish.id][ing] = true;
          });
        });
      },
      error: () =>
        (this.errorMessage = 'Falha ao carregar o menu. Tente novamente.'),
    });
  }

  obterIngredientesArray(dish: Dish): string[] {
    return dish.ingredients
      ? dish.ingredients
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean)
      : [];
  }

  // ===== Histórico do cliente =====
  carregarHistoricoPedidos(): void {
    if (!this.customerName) return;
    this.orderService.getOrdersByCustomerName(this.customerName).subscribe({
      next: (orders) => (this.orderHistory = orders),
    });
  }

  // ===== Seleção de ingredientes =====
  atualizarSelecaoIngrediente(
    dishId: number,
    ingredient: string,
    checked: boolean
  ): void {
    if (!this.selectedIngredients[dishId])
      this.selectedIngredients[dishId] = {};
    this.selectedIngredients[dishId][ingredient] = checked;
  }

  // ===== Carrinho =====
  adicionarAoCarrinho(dish: Dish): void {
    if (!this.quantities[dish.id] || this.quantities[dish.id] <= 0) {
      this.errorMessage = 'Selecione uma quantidade válida.';
      return;
    }
    const selecionados = Object.keys(this.selectedIngredients[dish.id]).filter(
      (k) => this.selectedIngredients[dish.id][k]
    );

    const existente = this.cart.find(
      (it) =>
        it.dish.id === dish.id &&
        JSON.stringify(it.selectedIngredients) === JSON.stringify(selecionados)
    );

    if (existente) {
      existente.quantity += this.quantities[dish.id];
    } else {
      this.cart.push({
        dish,
        quantity: this.quantities[dish.id],
        selectedIngredients: selecionados,
      });
    }

    this.quantities[dish.id] = 1;
    this.errorMessage = null;
  }

  removerDoCarrinho(index: number): void {
    this.cart.splice(index, 1);
  }

  atualizarQuantidade(index: number, q: number): void {
    q <= 0 ? this.removerDoCarrinho(index) : (this.cart[index].quantity = q);
  }

  obterPrecoTotal(): number {
    return this.cart.reduce((t, it) => t + it.dish.price * it.quantity, 0);
  }

  obterQuantidadeCarrinho(): number {
    return this.cart.reduce((sum, it) => sum + it.quantity, 0);
  }

  // ===== Checkout =====
  confirmarPagamento(): void {
    if (confirm('Confirmar pagamento do pedido?')) this.fazerPedido();
  }

  fazerPedido(): void {
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
      totalPrice: this.obterPrecoTotal(),
      status: 'Pendente',
      dishIds: this.cart.map((i) => i.dish.id),
      quantities: this.cart.map((i) => i.quantity),
      selectedIngredients: this.cart.map((i) => ({
        dishId: i.dish.id,
        ingredients: i.selectedIngredients,
      })),
    };

    this.orderService.createOrder(order).subscribe({
      next: (novoPedido) => {
        this.cart = [];
        this.orderStatus = novoPedido.status;
        this.currentOrderId = novoPedido.id ?? null;
        this.showTracking = true;
        this.errorMessage = null;
        this.definirAbaAtiva('track');
        this.carregarHistoricoPedidos();

        // Inicializa histórico com "Pendente"
        this.historicoStatus = [];
        const created = novoPedido.createdAt
          ? new Date(novoPedido.createdAt)
          : new Date();
        this.historicoStatus.push({ status: 'Pendente', at: created });

        // Inicia polling
        this.pollingInterval = setInterval(() => {
          this.orderService.getOrder(novoPedido.id!).subscribe({
            next: (u) => {
              this.atualizarEstadoRastreamento(u);
              if (u.status === 'Entregue') {
                clearInterval(this.pollingInterval);
                this.carregarHistoricoPedidos();
              }
            },
          });
        }, 10000);
      },
      error: (err) =>
        (this.errorMessage = `Falha ao fazer pedido: ${err.message}`),
    });
  }

  // ===== Linha do tempo (stepper) =====
  private obterIndiceEtapaAtual(status: string | null): number {
    if (!status) return 0;
    if (status === 'Pronto') return 3; // “Aguardando motoboy” (visual)
    const idx = this.ORDEM_ETAPAS.indexOf(status as any);
    return idx >= 0 ? idx : 0;
  }

  etapaConcluida(idx: number): boolean {
    const atual = this.obterIndiceEtapaAtual(this.orderStatus);
    return idx < atual;
  }

  etapaAtual(idx: number): boolean {
    const atual = this.obterIndiceEtapaAtual(this.orderStatus);
    return idx === atual;
  }

  obterRotuloEtapa(idx: number): string {
    const rotulos = [
      'Pedido feito',
      'Em produção',
      'Pronto',
      'Aguardando motoboy',
      'A caminho',
      'Entregue',
    ];
    return rotulos[idx] ?? '';
  }

  obterHorarioEtapa(idx: number): string | null {
    const mapa = [
      'Pendente',
      'Em produção',
      'Pronto',
      'Pronto', // “Aguardando motoboy” usa o mesmo timestamp de “Pronto”
      'Motoboy a caminho',
      'Entregue',
    ];
    const alvo = mapa[idx];
    const hit = [...this.historicoStatus]
      .reverse()
      .find((h) => h.status === alvo);
    return hit ? hit.at.toLocaleString() : null;
  }

  private atualizarEstadoRastreamento(u: Order): void {
    const anterior = this.orderStatus;
    this.orderStatus = u.status;

    if (!this.historicoStatus.length) {
      const firstWhen = u.createdAt ? new Date(u.createdAt) : new Date();
      this.historicoStatus.push({ status: 'Pendente', at: firstWhen });
    }

    if (anterior !== this.orderStatus) {
      const quando = u.updatedAt ? new Date(u.updatedAt) : new Date();
      this.historicoStatus.push({ status: this.orderStatus!, at: quando });
    }
  }

  // ===== UI =====
  definirAbaAtiva(tab: string): void {
    this.activeTab = tab;
  }

  definirCategoriaMenu(category: Dish['category']): void {
    this.menuCategory = category;
  }

  aoErroDeImagem(dish: Dish): void {
    (dish as any).imageUrl = '';
  }
}
