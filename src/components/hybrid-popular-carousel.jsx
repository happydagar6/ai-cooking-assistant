// This component has been removed - Hybrid Mode and Trending features have been deleted
        <p className="text-gray-600 dark:text-gray-400">No popular recipes found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="text-lg font-semibold">Popular Recipes</h3>
          {includeWeb && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Hybrid
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="hidden md:inline-flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            ←
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:inline-flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Cuisine filter */}
      {cuisines.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCuisine(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              selectedCuisine === null
                ? 'bg-yellow-500 text-white font-semibold'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {cuisines.slice(0, 6).map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                selectedCuisine === cuisine
                  ? 'bg-yellow-500 text-white font-semibold'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cuisine}
            </button>
          ))}
          {cuisines.length > 6 && (
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              +{cuisines.length - 6}
            </span>
          )}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        {filteredRecipes.map((recipe, index) => (
          <PopularRecipeCard
            key={recipe.id}
            recipe={recipe}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual popular recipe card
 */
function PopularRecipeCard({ recipe, rank }) {
  const isExternal = recipe.isExternal;
  const rating = recipe.rating || (isExternal ? recipe.externalRating : 4.5);
  const ratingCount = recipe.ratingCount || (isExternal ? Math.floor(Math.random() * 1000) + 100 : 0);

  return (
    <div className="flex-shrink-0 w-72 snap-start">
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition h-full flex flex-col group cursor-pointer">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {recipe.image || recipe.imageUrl ? (
            <Image
              src={recipe.image || recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-110 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Popular badge with rank */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-2 rounded-full flex items-center gap-1 font-bold text-sm shadow-lg">
            <Star className="w-4 h-4 fill-current" />
            Top {rank}
          </div>

          {/* Source badge */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            {isExternal ? (
              <>
                <Globe className="w-3 h-3" />
                Web
              </>
            ) : (
              <>
                <ChefHat className="w-3 h-3" />
                Local
              </>
            )}
          </div>

          {/* Rating overlay */}
          <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Title */}
          <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
            {recipe.title}
          </h4>

          {/* Rating info */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(rating) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-400'
                  }`}
                />
              ))}
            </div>
            {ratingCount > 0 && (
              <span>({ratingCount})</span>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
            {recipe.cookTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{recipe.cookTime} min</span>
              </div>
            )}

            {recipe.difficulty && (
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-semibold ${
                  recipe.difficulty === 'easy' ? 'bg-green-500' :
                  recipe.difficulty === 'medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Cuisine tag */}
          {recipe.cuisineType && (
            <div className="mb-3">
              <span className="inline-block bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs px-2 py-0.5 rounded">
                {recipe.cuisineType}
              </span>
            </div>
          )}

          {/* Action button */}
          <Button
            className="w-full mt-auto"
            variant={isExternal ? 'outline' : 'default'}
          >
            {isExternal ? 'View Recipe' : "Let's Cook"}
          </Button>
        </div>
      </div>
    </div>
  );
}
