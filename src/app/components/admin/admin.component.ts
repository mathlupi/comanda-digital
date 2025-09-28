import { Component, OnInit } from '@angular/core';
import { DishService, Dish } from '../../services/dish.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AdminComponent implements OnInit {
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

  constructor(private dishService: DishService, private router: Router) {}

  ngOnInit(): void {
    const userRole = sessionStorage.getItem('userRole');
    console.log('AdminComponent: User role:', userRole); // Debug log
    if (userRole !== 'Admin') {
      console.log(
        'AdminComponent: Redirecting to /admin/login due to invalid role'
      );
      this.router.navigate(['/admin/login']);
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
      console.log('Saving dish:', dishToSave); // Debug log
      this.dishService.createDish(dishToSave).subscribe({
        next: (dish) => {
          this.successMessage = 'Prato salvo com sucesso!';
          this.resetForm();
          console.log('Prato salvo:', dish);
          this.router.navigate(['/admin']); // Redirect to dish list after saving
        },
        error: (err) => {
          this.errorMessage = `Erro ao salvar prato: ${err.message}`;
          console.error('Erro ao salvar prato:', err);
        },
      });
    };

    if (this.selectedFile) {
      console.log('Uploading image:', this.selectedFile.name); // Debug log
      this.dishService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl) => {
          console.log('Imagem enviada:', imageUrl);
          saveDish(imageUrl);
        },
        error: (err) => {
          this.errorMessage = `Erro ao fazer upload da imagem: ${err.message}`;
          console.error('Erro no upload da imagem:', err);
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
  }
}
