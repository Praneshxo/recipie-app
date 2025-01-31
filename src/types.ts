export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  time: string;
  difficulty: string;
  category: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
}