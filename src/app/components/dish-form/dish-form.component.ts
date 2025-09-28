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
    category: 'Pratos',
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
    if (userRole !== 'Admin') {
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
                .filter(Boolean)
            : [];
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

    const saveDish = (uploadedUrl?: string) => {
      // Clona o prato atual
      const dishToSave: Dish = { ...this.dish };

      // Se houve upload, aplica o novo caminho
      if (uploadedUrl && uploadedUrl.trim()) {
        dishToSave.imageUrl = uploadedUrl.trim();
      }
      // Se não houve upload:
      // - em edição: mantém o imageUrl existente (já está em dishToSave)
      // - em criação: fica sem imageUrl (ok)

      const request = this.isEditMode
        ? this.dishService.updateDish(this.dish.id, dishToSave)
        : this.dishService.createDish(dishToSave);

      request.subscribe({
        next: (dish) => {
          this.successMessage = `Prato ${
            this.isEditMode ? 'atualizado' : 'salvo'
          } com sucesso!`;
          this.resetForm(); // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.errorMessage = `Erro ao salvar prato: ${err.message}`;
          console.error('DishFormComponent: Erro ao salvar prato:', err);
        },
      });
    };

    if (this.selectedFile) {
      // Faz upload e depois salva com o novo URL
      this.dishService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl) => saveDish(imageUrl),
        error: (err) => {
          this.errorMessage = `Erro ao fazer upload da imagem: ${err.message}`;
          console.error('DishFormComponent: Erro no upload da imagem:', err);
          // Continua salvando sem alterar o imageUrl
          saveDish();
        },
      });
    } else {
      // Não há novo arquivo — salva mantendo o imageUrl atual
      saveDish();
    }
  }

  /** Reseta o formulário para estado inicial */
  resetForm(): void {
    this.dish = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      category: 'Pratos',
      ingredients: '',
    };
    this.ingredientInput = '';
    this.selectedFile = null;
    this.ingredientsList = [];
    // Se quiser voltar para modo de criação após atualizar:
    this.isEditMode = false;
  }
}
