import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Dish {
  id: number; // Non-optional to match backend
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  ingredients: string; // String to match backend
}

@Injectable({
  providedIn: 'root',
})
export class DishService {
  private apiUrl = 'http://localhost:8080/dishes';

  constructor(private http: HttpClient) {}

  getDishes(): Observable<Dish[]> {
    return this.http
      .get<Dish[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getDish(id: number): Observable<Dish> {
    return this.http
      .get<Dish>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createDish(dish: Dish): Observable<Dish> {
    return this.http
      .post<Dish>(this.apiUrl, dish)
      .pipe(catchError(this.handleError));
  }

  updateDish(id: number, dish: Dish): Observable<Dish> {
    return this.http
      .put<Dish>(`${this.apiUrl}/${id}`, dish)
      .pipe(catchError(this.handleError));
  }

  deleteDish(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post(`${this.apiUrl}/upload-image`, formData, { responseType: 'text' })
      .pipe(
        map((response: string) => response),
        catchError(this.handleError)
      );
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
