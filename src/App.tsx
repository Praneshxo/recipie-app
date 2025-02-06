import React, { useState, useEffect } from 'react';
import { Search, Heart, ChefHat, UtensilsCrossed, Clock, ChefHat as DifficultyIcon, Filter, X, Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Recipe } from './types';
import { searchRecipesByIngredients, getRecipeById, getRandomRecipes } from './api/spoonacular';

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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const loadMoreRecipes = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let newRecipes;
      if (ingredientsInput) {
        const results = await searchRecipesByIngredients(
          ingredientsInput,
          selectedCuisine,
          selectedDishType,
          currentPage * ITEMS_PER_PAGE
        );
        newRecipes = results.recipes;
      } else {
        newRecipes = await getRandomRecipes(ITEMS_PER_PAGE);
      }
      
      if (newRecipes.length > 0) {
        setRecipes(prev => [...prev, ...newRecipes]);
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError('Failed to load more recipes. Please try again.');
      console.error('Load more error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // If we're moving to a page that might need more recipes
    if (newPage * ITEMS_PER_PAGE >= recipes.length && hasMore) {
      await loadMoreRecipes();
    }
  };

  useEffect(() => {
    const loadInitialRecipes = async () => {
      setIsLoading(true);
      try {
        const initialRecipes = await getRandomRecipes(ITEMS_PER_PAGE * 2); // Load 2 pages initially
        setRecipes(initialRecipes);
        setHasMore(initialRecipes.length === ITEMS_PER_PAGE * 2);
      } catch (err) {
        setError('Failed to load recipes. Please try again later.');
        console.error('Initial load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialRecipes();
  }, []);

  const handleIngredientSearch = async (resetPage: boolean = true) => {
    if (!ingredientsInput.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    if (resetPage) {
      setCurrentPage(1);
      setHasMore(true);
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchRecipesByIngredients(
        ingredientsInput,
        selectedCuisine,
        selectedDishType,
        0
      );
      
      if (results.recipes.length === 0) {
        setError('No recipes found with these ingredients. Try different ingredients or filters.');
        setHasMore(false);
      } else {
        setRecipes(results.recipes);
        setTotalResults(results.totalResults);
        setHasMore(results.recipes.length === ITEMS_PER_PAGE);
        if (resetPage) {
          setShowIngredientsModal(false);
        }
      }
    } catch (err) {
      setError('Failed to search recipes. Please try again later.');
      console.error('Search error:', err);
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

  const totalPages = Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE);

  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, difficultyFilter, timeFilter, showFavorites]);

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-lg">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Search by Ingredients</h2>
              <button onClick={() => setShowIngredientsModal(false)}>
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="mt-4">
              <input
                type="text"
                value={ingredientsInput}
                onChange={e => setIngredientsInput(e.target.value)}
                placeholder="Enter ingredients separated by commas..."
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <div className="mt-4">
                <button
                  onClick={() => handleIngredientSearch()}
                  disabled={isLoading}
                  className="w-full py-3 bg-[#D85C44] text-white rounded-lg"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="absolute top-20 left-0 right-0 z-40 bg-white p-6 shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif">Refine Your Search</h2>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficultyFilter}
                  onChange={e => setDifficultyFilter(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F0C14B] focus:border-transparent"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparation Time
                </label>
                <select
                  value={timeFilter}
                  onChange={e => setTimeFilter(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F0C14B] focus:border-transparent"
                >
                  <option value="All">All Times</option>
                  <option value="Quick">Quick (30 min or less)</option>
                  <option value="Medium">Medium (31-60 min)</option>
                  <option value="Long">Long (over 60 min)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as Category)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F0C14B] focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={selectedCuisine}
                  onChange={e => setSelectedCuisine(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F0C14B] focus:border-transparent"
                >
                  <option value="Italian">Italian</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="European">European</option>
                </select>
              </div>
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

      {!selectedRecipe && (
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedRecipes.map((recipe) => (
              <div 
                key={recipe.id}
                onClick={() => handleRecipeSelect(recipe.id)}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
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

          {filteredRecipes.length > 0 && (
            <div className="mt-12 flex items-center justify-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === page
                        ? 'bg-[#D85C44] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {filteredRecipes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No recipes found. Try adjusting your filters.</p>
            </div>
          )}
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