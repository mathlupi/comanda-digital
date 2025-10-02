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
    // Se preferir padronizar já no front, deixe em PT-BR:
    // category: 'Pratos',
    // Se quiser manter como estava e mapear na hora de salvar, use o original:
    category: 'Pratos',
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
    console.log('AdminComponent: User role:', userRole);
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
      // mantém sincronizado com o model, se você usa em outros lugares
      this.dish.ingredients = this.ingredientsList.join(',');
    }
  }

  removeIngredient(index: number): void {
    this.ingredientsList.splice(index, 1);
    this.dish.ingredients = this.ingredientsList.join(',');
  }

  // Mapeia categoria do formulário para o formato aceito pelo backend
  private mapCategoriaParaServidor(
    cat: string
  ): 'Pratos' | 'Bebidas' | 'Sobremesas' {
    switch (cat) {
      case 'Main Course':
        return 'Pratos';
      case 'Drink':
        return 'Bebidas';
      case 'Dessert':
        return 'Sobremesas';
      default:
        // Se já vier em PT-BR, mantém
        return cat as any;
    }
  }

  saveDish(): void {
    this.errorMessage = null;
    this.successMessage = null;

    const montarPayload = (imageUrl?: string) => {
      const categoriaServidor = this.mapCategoriaParaServidor(
        this.dish.category
      );

      // Monta payload limpo (sem id no create e sem ingredients vazio)
      const payload: any = {
        name: this.dish.name,
        description: this.dish.description,
        price: this.dish.price,
        category: categoriaServidor,
        ...(imageUrl ? { imageUrl } : {}),
      };

      const ingredientesStr = (this.ingredientsList || []).join(',').trim();
      if (ingredientesStr) {
        payload.ingredients = ingredientesStr;
      }

      console.log('Saving dish (payload):', payload);
      this.dishService.createDish(payload).subscribe({
        next: (dish) => {
          this.successMessage = 'Prato salvo com sucesso!';
          this.resetForm();
          console.log('Prato salvo:', dish);
          this.router.navigate(['/admin/dishes']); // volta para a lista
        },
        error: (err) => {
          this.errorMessage = `Erro ao salvar prato: ${err.message}`;
          console.error('Erro ao salvar prato:', err);
        },
      });
    };

    if (this.selectedFile) {
      console.log('Uploading image:', this.selectedFile.name);
      this.dishService.uploadImage(this.selectedFile).subscribe({
        next: (imageUrl) => {
          console.log('Imagem enviada:', imageUrl);
          montarPayload(imageUrl);
        },
        error: (err) => {
          console.error('Erro no upload da imagem:', err);
          // Prossegue sem imagem
          montarPayload();
        },
      });
    } else {
      montarPayload();
    }
  }

  resetForm(): void {
    this.dish = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      // Se quiser já padronizar para PT-BR:
      // category: 'Pratos',
      category: 'Pratos',
      ingredients: '',
    };
    this.ingredientInput = '';
    this.selectedFile = null;
    this.ingredientsList = [];
  }
}
