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
    console.log('DishListComponent: User role:', userRole ?? 'null');
    if (userRole !== 'Admin') {
      console.log('DishListComponent: Redirecting to /admin/login');
      this.router.navigate(['/admin/login']);
      return;
    }
    this.loadDishes();
  }

  loadDishes(): void {
    this.dishService.getDishes().subscribe({
      next: (data) => {
        this.dishes = data;
        console.log('DishListComponent: Dishes loaded:', data);
        data.forEach((dish) => {
          if (dish.imageUrl) {
            console.log(
              'DishListComponent: Image URL for',
              dish.name,
              ':',
              dish.imageUrl
            );
            const img = new Image();
            img.src = dish.imageUrl;
            img.onload = () =>
              console.log(
                'DishListComponent: Image loaded successfully:',
                dish.imageUrl
              );
            img.onerror = () =>
              console.error(
                'DishListComponent: Failed to load image:',
                dish.imageUrl
              );
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'Erro ao carregar pratos: ' + err.message;
        console.error('DishListComponent: Erro ao carregar pratos:', err);
      },
    });
  }

  editDish(id: number): void {
    console.log('DishListComponent: Navigating to edit dish:', id);
    this.router.navigate(['/admin/edit-dish', id]);
  }

  deleteDish(id: number): void {
    if (confirm('Tem certeza que deseja excluir este prato?')) {
      console.log('DishListComponent: Deleting dish:', id);
      this.dishService.deleteDish(id).subscribe({
        next: () => {
          this.dishes = this.dishes.filter((d) => d.id !== id);
          console.log('DishListComponent: Prato excluído:', id);
        },
        error: (err) => {
          this.errorMessage = 'Erro ao excluir prato: ' + err.message;
          console.error('DishListComponent: Erro ao excluir prato:', err);
        },
      });
    }
  }

  addNewDish(): void {
    console.log('DishListComponent: Navigating to add new dish');
    this.router.navigate(['/admin/add-dish']);
  }

  onImageError(dish: Dish): void {
    console.error(
      'DishListComponent: Image failed to load for dish:',
      dish.name,
      'URL:',
      dish.imageUrl
    );
  }
}
