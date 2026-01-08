// This component has been removed - Hybrid Mode and Trending features have been deleted
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Trending Now</h3>
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

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        {recipes.map((recipe, index) => (
          <TrendingRecipeCard
            key={recipe.id}
            recipe={recipe}
            index={index}
            total={recipes.length}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual trending recipe card
 */
function TrendingRecipeCard({ recipe, index, total }) {
  const isExternal = recipe.isExternal;
  const trendingRank = index + 1;

  // Calculate trend intensity for visual effect
  const trendIntensity = Math.max(0.3, 1 - (index / total) * 0.7);

  return (
    <div className="flex-shrink-0 w-72 snap-start">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition h-full flex flex-col group cursor-pointer"
        style={{
          opacity: trendIntensity,
          transform: `scale(${0.95 + trendIntensity * 0.05})`,
        }}
      >
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
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

          {/* Trending badge with rank */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg">
            <Flame className="w-4 h-4 fill-current animate-pulse" />
            #{trendingRank}
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

          {/* Trust/Rating badge for external */}
          {isExternal && recipe.trustScore && (
            <div className="absolute bottom-3 left-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded">
              ★ {(recipe.trustScore * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Title */}
          <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400">
            {recipe.title}
          </h4>

          {/* Description or snippet */}
          {recipe.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {recipe.description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-4">
            {recipe.cookTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{recipe.cookTime} min</span>
              </div>
            )}

            {recipe.difficulty && (
              <div className={`inline-block px-2 py-0.5 rounded text-white text-xs font-semibold ${
                recipe.difficulty === 'easy' ? 'bg-green-500' :
                recipe.difficulty === 'medium' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}>
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </div>
            )}
          </div>

          {/* Dietary tags */}
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <div className="mb-3 flex gap-1 flex-wrap">
              {recipe.dietary_tags.slice(0, 2).map((tag) => (
                <span key={tag} className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
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
