import { Pipe, PipeTransform } from '@angular/core';
import { Dish } from '../services/dish.service';

@Pipe({ name: 'filterByCategory', standalone: true })
export class FilterByCategoryPipe implements PipeTransform {
  private normalize(cat: string): Dish['category'] {
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

  transform(dishes: Dish[], category: Dish['category']): Dish[] {
    const wanted = this.normalize(category);
    return dishes.filter((d) => this.normalize(d.category) === wanted);
  }
}
