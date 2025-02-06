import { Recipe } from '../types';

const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  extendedIngredients: {
    original: string;
  }[];
  analyzedInstructions: {
    steps: {
      step: string;
    }[];
  }[];
}

export const getRandomRecipes = async (number: number = 9): Promise<Recipe[]> => {
  try {
    const params = new URLSearchParams({
      apiKey: API_KEY,
      number: number.toString(),
      tags: 'italian', // Focus on Italian cuisine
    });

    const response = await fetch(
      `${BASE_URL}/random?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.recipes.map(transformSpoonacularRecipe);
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    return [];
  }
};

export const searchRecipesByIngredients = async (
  ingredients: string,
  cuisine?: string,
  type?: string,
  offset: number = 0
): Promise<{ recipes: Recipe[]; totalResults: number }> => {
  try {
    // First, search by ingredients
    const ingredientParams = new URLSearchParams({
      apiKey: API_KEY,
      ingredients,
      number: '20',
      offset: offset.toString(),
      ranking: '2',
      ignorePantry: 'true',
    });

    const ingredientResponse = await fetch(
      `${BASE_URL}/findByIngredients?${ingredientParams.toString()}`
    );
    
    if (!ingredientResponse.ok) {
      throw new Error(`API responded with status: ${ingredientResponse.status}`);
    }
    
    const ingredientResults = await ingredientResponse.json();
    
    if (!Array.isArray(ingredientResults)) {
      throw new Error('Invalid API response format');
    }

    // Get detailed information for each recipe
    const detailedRecipes = await Promise.all(
      ingredientResults.map(recipe => getRecipeById(recipe.id))
    );

    const validRecipes = detailedRecipes.filter((recipe): recipe is Recipe => 
      recipe !== null && 
      (!cuisine || recipe.category.toLowerCase().includes(cuisine.toLowerCase())) &&
      (!type || recipe.category.toLowerCase().includes(type.toLowerCase()))
    );

    return {
      recipes: validRecipes,
      totalResults: ingredientResults.length
    };
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};

export const getRecipeById = async (id: number): Promise<Recipe | null> => {
  try {
    const params = new URLSearchParams({
      apiKey: API_KEY,
    });

    const response = await fetch(
      `${BASE_URL}/${id}/information?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: SpoonacularRecipe = await response.json();
    return transformSpoonacularRecipe(data);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
};

const transformSpoonacularRecipe = (recipe: SpoonacularRecipe): Recipe => {
  return {
    id: recipe.id,
    title: recipe.title || 'Untitled Recipe',
    description: recipe.summary 
      ? recipe.summary.replace(/<[^>]*>/g, '').slice(0, 200) + '...' 
      : 'No description available',
    image: recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352',
    time: `${recipe.readyInMinutes || 30} mins`,
    difficulty: getDifficulty(recipe.readyInMinutes || 30),
    category: recipe.dishTypes?.[0] || 'Main Course',
    ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
    instructions: recipe.analyzedInstructions?.[0]?.steps.map(step => step.step) || [],
    servings: recipe.servings || 4
  };
};

const getDifficulty = (time: number): string => {
  if (time <= 30) return 'Easy';
  if (time <= 60) return 'Medium';
  return 'Hard';
};