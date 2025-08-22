import { Pipe, PipeTransform } from '@angular/core';
import { Dish } from '../services/dish.service';

@Pipe({
  name: 'filterByCategory',
  standalone: true,
})
export class FilterByCategoryPipe implements PipeTransform {
  transform(dishes: Dish[], category: string): Dish[] {
    return dishes.filter((dish) => dish.category === category);
  }
}
