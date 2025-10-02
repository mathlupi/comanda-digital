import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/order.service';
import { Router, RouterLink } from '@angular/router';

type DiaAgg = { date: string; orders: number; revenue: number };

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  carregando = true;
  erro: string | null = null;

  // KPIs
  totalPedidos = 0;
  faturamentoTotal = 0;
  pedidosHoje = 0;
  faturamentoHoje = 0;

  // Por status
  porStatus: Record<string, number> = {};

  // Séries por dia (últimos 14 dias)
  serieDias: DiaAgg[] = [];

  constructor(private orderService: OrderService, public router: Router) {}

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.processar(orders);
        this.carregando = false;
      },
      error: (err) => {
        console.error(err);
        this.erro = 'Falha ao carregar pedidos.';
        this.carregando = false;
      },
    });
  }

  private processar(orders: Order[]): void {
    const hojeISO = this.zdata(new Date()); // string 'YYYY-MM-DD'
    const inicio = this.addDays(hojeISO, -13); // string

    const mapa: Record<string, DiaAgg> = {};
    for (let d = 0; d < 14; d++) {
      const dia = this.addDays(inicio, d); // ✅ já é string ISO
      mapa[dia] = { date: dia, orders: 0, revenue: 0 };
    }

    this.totalPedidos = orders.length;
    this.faturamentoTotal = 0;
    this.porStatus = {};

    for (const o of orders) {
      // conta status
      this.porStatus[o.status] = (this.porStatus[o.status] || 0) + 1;

      // receita apenas quando "Entregue"
      const receita = o.status === 'Entregue' ? o.totalPrice || 0 : 0;
      this.faturamentoTotal += receita;

      // base para agregação
      const baseDate = o.updatedAt || o.createdAt;
      if (baseDate) {
        const dia = this.formatISO(new Date(baseDate)); // Date -> 'YYYY-MM-DD'
        if (mapa[dia]) {
          mapa[dia].orders += 1;
          mapa[dia].revenue += receita;
        }

        // Hoje
        if (dia === hojeISO) {
          this.pedidosHoje += 1;
          this.faturamentoHoje += receita;
        }
      }
    }

    this.serieDias = Object.values(mapa).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  // --------- helpers de data ---------
  private zdata(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  private formatISO(d: Date): string {
    // normaliza para meia-noite
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return this.zdata(nd);
  }

  private addDays(isoOrDate: string | Date, days: number): string {
    const d =
      typeof isoOrDate === 'string' ? new Date(isoOrDate) : new Date(isoOrDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return this.zdata(d); // retorna string 'YYYY-MM-DD'
  }

  // --------- helpers de gráfico ---------
  maxOrders(): number {
    const vals = this.serieDias.map((d) => d.orders);
    return Math.max(1, ...(vals.length ? vals : [0]));
  }
  maxRevenue(): number {
    const vals = this.serieDias.map((d) => d.revenue);
    return Math.max(1, ...(vals.length ? vals : [0]));
  }

  alturaBarraOrders(v: number): string {
    return ((v / this.maxOrders()) * 100).toFixed(2) + '%';
  }
  alturaBarraRevenue(v: number): string {
    return ((v / this.maxRevenue()) * 100).toFixed(2) + '%';
  }

  labelDia(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}`;
  }
}
