import { Component, OnInit } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dish-list',
  templateUrl: './dish-list.component.html',
  styleUrls: ['./dish-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DishListComponent implements OnInit {
  dishes: Dish[] = [];
  errorMessage: string | null = null;

  constructor(private dishService: DishService, private router: Router) {}

  ngOnInit(): void {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'Admin') {
      this.router.navigate(['/admin/login']);
      return;
    }
    this.loadDishes();
  }

  loadDishes(): void {
    this.dishService.getDishes().subscribe({
      next: (data) => {
        this.dishes = data;
      },
      error: (err) => {
        this.errorMessage = 'Erro ao carregar pratos: ' + err.message;
      },
    });
  }

  editDish(id: number): void {
    this.router.navigate(['/admin/edit-dish', id]);
  }

  deleteDish(id: number): void {
    if (confirm('Tem certeza que deseja excluir este prato?')) {
      this.dishService.deleteDish(id).subscribe({
        next: () => {
          this.dishes = this.dishes.filter((d) => d.id !== id);
        },
        error: (err) => {
          this.errorMessage = 'Erro ao excluir prato: ' + err.message;
        },
      });
    }
  }

  /** Alias antigo que alguns templates podem usar */
  addDish(): void {
    this.router.navigate(['/admin/add-dish']);
  }

  /** Usado no HTML atual */
  addNewDish(): void {
    this.addDish();
  }

  /** Evita quebrar layout se a imagem falhar */
  onImageError(dish: Dish): void {
    (dish as any).imageUrl = '';
  }

  /** Converte valores legados EN -> PT-BR para exibição */
  getCategoriaPt(cat: string): string {
    switch (cat) {
      case 'Main Course':
        return 'Pratos';
      case 'Drink':
        return 'Bebidas';
      case 'Dessert':
        return 'Sobremesas';
      default:
        return cat;
    }
  }
}
