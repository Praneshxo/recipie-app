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

export const searchRecipesByIngredients = async (
  ingredients: string,
  cuisine?: string,
  type?: string
) => {
  try {
    // Set up query parameters with required fields
    const params = new URLSearchParams({
      apiKey: API_KEY,
      ingredients: ingredients,
      number: '12', // Return up to 12 recipes
      ranking: '2', // Maximize used ingredients
      ignorePantry: 'true', // Ignore common pantry ingredients
    });

    // Append optional parameters to the query string
    if (cuisine) {
      params.append('cuisine', cuisine);
    }
    if (type) {
      params.append('dishType', type);
    }

    // Send the request to the API
    const response = await fetch(`${BASE_URL}/findByIngredients?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const results = await response.json();
    
    if (!Array.isArray(results)) {
      throw new Error('Invalid API response format');
    }

    // Get detailed information for each recipe
    const detailedRecipes = await Promise.all(
      results.slice(0, 5).map(recipe => getRecipeById(recipe.id)) // Fetch detailed recipe info for up to 5 recipes
    );

    return detailedRecipes.filter((recipe): recipe is Recipe => recipe !== null);
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

    const response = await fetch(`${BASE_URL}/${id}/information?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: SpoonacularRecipe = await response.json();
    return transformSpoonacularRecipe(data);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null; // Return null if the recipe fetch fails
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
