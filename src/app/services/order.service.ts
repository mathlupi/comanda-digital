import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DishIngredients {
  dishId: number;
  ingredients: string[];
}

export interface Order {
  id?: number;
  customerName: string;
  customerAddress: string;
  totalPrice: number;
  status: string;
  dishIds: number[];
  quantities: number[];
  selectedIngredients?: DishIngredients[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/orders';

  constructor(private http: HttpClient) {}

  createOrder(order: Order): Observable<Order> {
    console.log('Enviando POST para:', this.apiUrl, 'com payload:', order);
    return this.http
      .post<Order>(this.apiUrl, order)
      .pipe(catchError(this.handleError));
  }

  getOrder(id: number): Observable<Order> {
    return this.http
      .get<Order>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getOrders(): Observable<Order[]> {
    return this.http
      .get<Order[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getOrdersByCustomerName(customerName: string): Observable<Order[]> {
    return this.http
      .get<Order[]>(`${this.apiUrl}/customer/${customerName}`)
      .pipe(catchError(this.handleError));
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http
      .put<Order>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erro na requisição:', error);
    let errorMessage = 'Ocorreu um erro desconhecido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro no cliente: ${error.error.message}`;
    } else {
      errorMessage = `Erro no servidor: ${error.status} - ${
        error.message || error.error || 'Sem detalhes'
      }`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
