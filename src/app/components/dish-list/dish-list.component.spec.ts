import { Component, OnInit } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dish-list',
  templateUrl: './dish-list.component.html',
  styleUrls: ['./dish-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DishListComponent implements OnInit {
  dishes: Dish[] = [];

  constructor(private dishService: DishService, private router: Router) {}

  ngOnInit(): void {
    this.dishService.getDishes().subscribe((data: Dish[]) => {
      this.dishes = data;
    });
  }

  editDish(id: number): void {
    this.router.navigate([`/admin/edit-dish/${id}`]);
  }

  deleteDish(id: number): void {
    this.dishService.deleteDish(id).subscribe(() => {
      this.dishes = this.dishes.filter((dish) => dish.id !== id);
    });
  }

  addDish(): void {
    this.router.navigate(['/admin/add-dish']);
  }
}
