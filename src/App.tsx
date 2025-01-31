import React, { useState, useEffect } from 'react';
import { Search, Heart, ChefHat, UtensilsCrossed, Clock, ChefHat as DifficultyIcon, Filter, X, Search as SearchIcon } from 'lucide-react';
import {  Recipe as RecipeType } from './types';
import { searchRecipesByIngredients, getRecipeById } from './api/spoonacular';

interface Recipe {
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

type Category = 'All' | 'Pasta' | 'Pizza' | 'Soup' | 'Dessert' | 'Main Course';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('All');
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Italian');
  const [selectedDishType, setSelectedDishType] = useState('Main Course');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: 1,
      title: 'Classic Margherita Pizza',
      description: 'Traditional Neapolitan pizza with fresh basil, mozzarella, and tomatoes',
      image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca',
      time: '30 mins',
      difficulty: 'Medium',
      category: 'Pizza',
      ingredients: [
        '00 flour', 'Fresh yeast', 'Salt', 'Water',
        'San Marzano tomatoes', 'Fresh mozzarella', 'Basil leaves', 'Olive oil'
      ],
      instructions: [
        'Prepare the pizza dough and let it rise for 4 hours',
        'Stretch the dough by hand into a thin circle',
        'Top with crushed tomatoes, fresh mozzarella, and basil',
        'Bake in a very hot oven until the crust is charred'
      ],
      servings: 2
    },
    {
      id: 2,
      title: 'Homemade Pasta Carbonara',
      description: 'Creamy pasta dish with pancetta, eggs, and Pecorino Romano',
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
      time: '25 mins',
      difficulty: 'Medium',
      category: 'Pasta',
      ingredients: [
        'Spaghetti', 'Guanciale or pancetta', 'Eggs', 'Pecorino Romano',
        'Black pepper', 'Salt'
      ],
      instructions: [
        'Cook pasta in salted water until al dente',
        'Crisp the guanciale in a pan',
        'Mix eggs with grated cheese and pepper',
        'Combine hot pasta with egg mixture and guanciale'
      ],
      servings: 4
    },
    {
      id: 3,
      title: 'Tuscan Ribollita Soup',
      description: 'Hearty vegetable soup with bread, beans, and Tuscan kale',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
      time: '45 mins',
      difficulty: 'Easy',
      category: 'Soup',
      ingredients: [
        'Cannellini beans', 'Tuscan kale', 'Carrots', 'Celery',
        'Onion', 'Stale bread', 'Tomatoes', 'Olive oil'
      ],
      instructions: [
        'Sauté vegetables until softened',
        'Add beans and tomatoes, simmer',
        'Layer bread and soup in a pot',
        'Bake until crusty on top'
      ],
      servings: 6
    },
    {
      id: 4,
      title: 'Tiramisu',
      description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
      time: '40 mins',
      difficulty: 'Medium',
      category: 'Dessert',
      ingredients: [
        'Ladyfingers', 'Mascarpone', 'Eggs', 'Coffee',
        'Cocoa powder', 'Sugar'
      ],
      instructions: [
        'Make strong coffee and let it cool',
        'Beat egg yolks with sugar, then fold in mascarpone',
        'Dip ladyfingers in coffee and layer in dish',
        'Top with mascarpone mixture and cocoa powder'
      ],
      servings: 8
    },
    {
      id: 5,
      title: 'Osso Buco',
      description: 'Braised veal shanks in white wine and broth',
      image: 'https://images.unsplash.com/photo-1544378730-8b5104b18790',
      time: '2.5 hrs',
      difficulty: 'Hard',
      category: 'Main Course',
      ingredients: [
        'Veal shanks', 'White wine', 'Broth', 'Onion',
        'Carrots', 'Celery', 'Gremolata', 'Olive oil'
      ],
      instructions: [
        'Brown the veal shanks on all sides',
        'Sauté vegetables until softened',
        'Add wine and broth, simmer until tender',
        'Top with fresh gremolata'
      ],
      servings: 4
    },
    // Add more recipes below
    {
      id: 6,
      title: 'Vegetarian Lasagna',
      description: 'Layered lasagna with spinach, ricotta, and marinara sauce',
      image: 'https://images.unsplash.com/photo-1560425607-499991ff3f6f',
      time: '1 hr',
      difficulty: 'Medium',
      category: 'Pasta',
      ingredients: [
        'Lasagna noodles', 'Spinach', 'Ricotta cheese', 'Mozzarella',
        'Parmesan', 'Marinara sauce', 'Garlic', 'Onion', 'Olive oil'
      ],
      instructions: [
        'Cook lasagna noodles and set aside',
        'Sauté spinach and garlic',
        'Layer noodles, ricotta, spinach, marinara sauce, and cheese',
        'Bake until bubbly and golden'
      ],
      servings: 6
    },
    {
      id: 7,
      title: 'Caprese Salad',
      description: 'Fresh mozzarella, tomatoes, and basil with olive oil and balsamic vinegar',
      image: 'https://images.unsplash.com/photo-1598080195442-7467ef0d7b58',
      time: '15 mins',
      difficulty: 'Easy',
      category: 'Appetizer',
      ingredients: [
        'Fresh mozzarella', 'Tomatoes', 'Basil', 'Olive oil',
        'Balsamic vinegar', 'Salt', 'Pepper'
      ],
      instructions: [
        'Slice tomatoes and mozzarella',
        'Arrange on a plate with basil leaves',
        'Drizzle with olive oil and balsamic vinegar',
        'Season with salt and pepper'
      ],
      servings: 4
    },
    // Add more recipes as needed...
  ]);
  

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (recipeId: number) => {
    setFavorites(prev => 
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleIngredientSearch = async () => {
    if (!ingredientsInput.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchRecipesByIngredients(
        ingredientsInput,
        selectedCuisine,
        selectedDishType
      );
      
      if (results.length === 0) {
        setError('No recipes found with these ingredients. Try different ingredients or filters.');
      } else {
        setRecipes(results);
        setShowIngredientsModal(false);
      }
    } catch (err) {
      setError('Failed to search recipes. Please try again later.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeSelect = async (recipeId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const recipe = await getRecipeById(recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
      } else {
        setError('Failed to load recipe details.');
      }
    } catch (err) {
      setError('Failed to load recipe details. Please try again.');
      console.error('Recipe select error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
    const matchesDifficulty = difficultyFilter === 'All' || recipe.difficulty === difficultyFilter;
    const matchesTime = timeFilter === 'All' || 
                       (timeFilter === 'Quick' && parseInt(recipe.time) <= 30) ||
                       (timeFilter === 'Medium' && parseInt(recipe.time) > 30 && parseInt(recipe.time) <= 60) ||
                       (timeFilter === 'Long' && parseInt(recipe.time) > 60);
    const matchesFavorites = !showFavorites || favorites.includes(recipe.id);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTime && matchesFavorites;
  });

  const categories: Category[] = ['All', 'Pasta', 'Pizza', 'Soup', 'Dessert', 'Main Course'];

  return (
    <div className="min-h-screen bg-[#F8F1E1]">
      <header className="bg-[#2C2C2C] text-[#F4F1EB] py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-[#F0C14B]" />
              <h1 className="text-2xl font-serif">Cucina Romana</h1>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setShowIngredientsModal(true)}
                className="flex items-center space-x-1 hover:text-[#F0C14B] transition-colors"
              >
                <SearchIcon className="h-5 w-5" />
                <span>Find by Ingredients</span>
              </button>
              <button 
                onClick={() => {
                  setShowFavorites(false);
                  setSelectedRecipe(null);
                }} 
                className="flex items-center space-x-1 hover:text-[#F0C14B] transition-colors"
              >
                <UtensilsCrossed className="h-5 w-5" />
                <span>Recipes</span>
              </button>
              <button 
                onClick={() => {
                  setShowFavorites(true);
                  setSelectedRecipe(null);
                }}
                className="flex items-center space-x-1 hover:text-[#F0C14B] transition-colors"
              >
                <Heart className="h-5 w-5" fill={showFavorites ? "#F0C14B" : "none"} />
                <span>Favorites</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 hover:text-[#F0C14B] transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {showIngredientsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif">Find Recipes by Ingredients</h2>
              <button 
                onClick={() => setShowIngredientsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Enter your ingredients (separate with commas)
                </label>
                <input
                  type="text"
                  value={ingredientsInput}
                  onChange={(e) => setIngredientsInput(e.target.value)}
                  placeholder="e.g., tomatoes, pasta, olive oil"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F0C14B] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Cuisine Type
                </label>
                <div className="flex space-x-4">
                  {['Italian', 'Chinese', 'Indian'].map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => setSelectedCuisine(cuisine)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        selectedCuisine === cuisine
                          ? 'bg-[#D85C44] text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Dish Type
                </label>
                <div className="flex space-x-4">
                  {['Main Course', 'Appetizer', 'Dessert'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedDishType(type)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        selectedDishType === type
                          ? 'bg-[#D85C44] text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleIngredientSearch}
                className="w-full py-3 bg-[#D85C44] text-white rounded-lg hover:bg-[#c54e39] transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Find Recipes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedRecipe && (
        <div 
          className="relative h-[400px] bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1498579150354-977475b7ea0b)',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-serif mb-6 text-center">
              {showFavorites ? 'Your Favorite Italian Recipes' : 'Discover Authentic Italian Recipes'}
            </h2>
            <div className="w-full max-w-2xl px-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for recipes or ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-full text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-[#F0C14B] placeholder-gray-500"
                />
                <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilters && !selectedRecipe && (
        <div className="bg-white shadow-md p-6">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-serif text-lg mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        selectedCategory === category
                          ? 'bg-[#F0C14B] text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <h3 className="font-serif text-lg mb-3">Difficulty</h3>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        difficultyFilter === diff
                          ? 'bg-[#F0C14B] text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <h3 className="font-serif text-lg mb-3">Preparation Time</h3>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Quick', 'Medium', 'Long'].map(time => (
                    <button
                      key={time}
                      onClick={() => setTimeFilter(time)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        timeFilter === time
                          ? 'bg-[#F0C14B] text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRecipe && (
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedRecipe(null)}
            className="mb-6 flex items-center text-gray-600 hover:text-[#D85C44]"
          >
            <X className="h-5 w-5 mr-2" />
            Back to recipes
          </button>
          
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="relative h-[400px]">
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleFavorite(selectedRecipe.id)}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/90 hover:bg-white transition-colors"
              >
                <Heart
                  className="h-6 w-6 text-[#D85C44]"
                  fill={favorites.includes(selectedRecipe.id) ? "#D85C44" : "none"}
                />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-serif">{selectedRecipe.title}</h2>
                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{selectedRecipe.time}</span>
                  </div>
                  <div className="flex items-center">
                    <DifficultyIcon className="h-5 w-5 mr-2" />
                    <span>{selectedRecipe.difficulty}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-8">{selectedRecipe.description}</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-serif text-xl mb-4">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-[#F0C14B] rounded-full mr-3"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-serif text-xl mb-4">Instructions</h3>
                  <ol className="space-y-4">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <span className="font-serif text-[#F0C14B] mr-4">{index + 1}.</span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedRecipe && (
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe) => (
              <div 
                key={recipe.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => handleRecipeSelect(recipe.id)}
              >
                <div className="relative h-48">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                  >
                    <Heart
                      className="h-5 w-5 text-[#D85C44]"
                      fill={favorites.includes(recipe.id) ? "#D85C44" : "none"}
                    />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl mb-2">{recipe.title}</h3>
                  <p className="text-gray-600 mb-4">{recipe.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{recipe.time}</span>
                    <span>{recipe.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D85C44]"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;