import { Component, OnInit } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dish-form',
  templateUrl: './dish-form.component.html',
  styleUrls: ['./dish-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DishFormComponent implements OnInit {
  dish: Dish = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    category: 'Main Course',
    ingredients: '',
  };
  ingredientInput: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedFile: File | null = null;
  ingredientsList: string[] = [];
  isEditMode: boolean = false;

  constructor(
    private dishService: DishService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userRole = sessionStorage.getItem('userRole');
    console.log('DishFormComponent: User role:', userRole ?? 'null');
    if (userRole !== 'Admin') {
      console.log(
        'DishFormComponent: Redirecting to /admin/login due to invalid role'
      );
      this.router.navigate(['/admin/login']);
      return;
    }

    const dishId = this.route.snapshot.paramMap.get('id');
    if (dishId) {
      this.isEditMode = true;
      this.dishService.getDish(+dishId).subscribe({
        next: (dish) => {
          this.dish = dish;
          this.ingredientsList = dish.ingredients
            ? dish.ingredients
                .split(',')
                .map((i) => i.trim())
                .filter((i) => i)
            : [];
          console.log('DishFormComponent: Editing dish:', dish);
        },
        error: (err) => {
          this.errorMessage = `Erro ao carregar prato: ${err.message}`;
          console.error('DishFormComponent: Erro ao carregar prato:', err);
        },
      });
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  addIngredient(): void {
    if (this.ingredientInput.trim()) {
      this.ingredientsList.push(this.ingredientInput.trim());
      this.ingredientInput = '';
      this.dish.ingredients = this.ingredientsList.join(',');
    }
  }

  removeIngredient(index: number): void {
    this.ingredientsList.splice(index, 1);
    this.dish.ingredients = this.ingredientsList.join(',');
  }

  saveDish(): void {
    this.errorMessage = null;
    this.successMessage = null;

    const saveDish = (imageUrl?: string) => {
      const dishToSave: Dish = { ...this.dish, imageUrl };
      console.log('DishFormComponent: Saving dish:', dishToSave);
      const request = this.isEditMode
        ? this.dishService.updateDish(this.dish.id, dishToSave)
        : this.dishService.createDish(dishToSave);
      request.subscribe({
        next: (dish) => {
          this.successMessage = `Prato ${
            this.isEditMode ? 'atualizado' : 'salvo'
          } com sucesso!`;
          this.resetForm();
          console.log('DishFormComponent: Prato salvo:', dish);
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.errorMessage = `Erro ao salvar prato: ${err.message}`;
          console.error('DishFormComponent: Erro ao salvar prato:', err);
        },
      });
    };

    if (this.selectedFile) {
      console.log(
        'DishFormComponent: Uploading image:',
        this.selectedFile.name
      );
      this.dishService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl) => {
          console.log('DishFormComponent: Imagem enviada:', imageUrl);
          saveDish(imageUrl);
        },
        error: (err) => {
          this.errorMessage = `Erro ao fazer upload da imagem: ${err.message}`;
          console.error('DishFormComponent: Erro no upload da imagem:', err);
          saveDish(); // Proceed without image
        },
      });
    } else {
      saveDish();
    }
  }
  resetForm(): void {
    this.dish = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      category: 'Main Course',
      ingredients: '',
    };
    this.ingredientInput = '';
    this.selectedFile = null;
    this.ingredientsList = [];
    this.isEditMode = false;
  }
}
