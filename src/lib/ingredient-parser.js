// Parse ingredient strings and extract quantity, unit, and name

export const parseIngredient = (ingredientString) => {
  if (typeof ingredientString !== "string") {
    return {
      quantity: 1,
      unit: "piece",
      name: String(ingredientString),
      original: ingredientString,
      error: "Invalid ingredient format",
    };
  }

  // Common patterns for ingredient parsing
  const patterns = [
    // "2 cups flour" or "1.5 cup flour"
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s+(\w+(?:\s+\w+)*?)\s+(.+)$/,
    // "2 cups of flour"
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s+(\w+(?:\s+\w+)*?)\s+of\s+(.+)$/,
    // "flour - 2 cups"
    /^(.+?)\s*[-–—]\s*(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s+(\w+(?:\s+\w+)*)$/,
    // "2 large eggs" (quantity + adjective + item)
    /^(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s+(.*?)$/,
  ];

  const ingredient = ingredientString.trim();

  for (const pattern of patterns) {
    const match = ingredient.match(pattern);
    if (match) {
      let quantity, unit, name;

      if (pattern === patterns[2]) {
        // Handle "ingredient - quantity unit" format
        [, name, quantity, unit] = match;
      } else {
        [, quantity, unit, name] = match;

        // If no match captured, unit might be the name
        if (!name && unit) {
          name = unit;
          unit = "piece"; // Default unit
        }
      }
      return {
        quantity: parseQuantity(quantity),
        unit: unit || "piece",
        name: name || "ingredient",
        original: ingredient,
        error: null,
      };
    }
  }

  // If no patterns matched, treat as single ingredient with default quantity and unit
  return {
    quantity: 1,
    unit: "piece",
    name: ingredient,
    original: ingredient,
    error: 'Could not parse ingredient details',
  }
};

// Parse quantity strings like "1", "1.5", "1/2", "1 1/2"

export const parseQuantity = (quantityStr) => {
    if(typeof quantityStr === 'number') return quantityStr;

    const str = String(quantityStr).trim(); // Ensure it's a string

    // Handle mixed numbers like "1 1/2"
    const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if(mixedMatch){
        const [, whole, numerator, denominator] = mixedMatch;
        return parseInt(whole) + parseInt(numerator) / parseInt(denominator);
    }

    // Handle simple fractions like "1/2"
    const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
    if(fractionMatch){
        const [,numerator, denominator] = fractionMatch;
        return parseInt(numerator) / parseInt(denominator);
    }

    // Handle decimal numbers like "1.5"
    const decimal = parseFloat(str);
    if(!isNaN(decimal)) return decimal;

    // If all parsing fails, return 1 as default
    return 1;
} 


// Format quantity for display
export const formatQuantity = (quantity) => {
    if(quantity === parseInt(quantity)){
        return String(quantity); // return whole numbers as integers
    }

    // Try to convert to fraction for common values
    const commonFractions = {
         0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
    1: '1',
    1.25: '1 1/4',
    1.33: '1 1/3',
    1.5: '1 1/2',
    1.67: '1 2/3',
    1.75: '1 3/4',
    2.5: '2 1/2',
    3.5: '3 1/2'
    }

    // Find closest fraction
    const rounded = Math.round(quantity * 100) / 100; // Round to 2 decimal places
    const fraction = commonFractions[rounded];
    if(fraction) return fraction;

    // Return decimal rounded to 2 places
    return quantity.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
}

// Scale a parsed ingredient 
export const scaleIngredient = (parsedIngredient, scaleFactor) => {
    const newQuantity = parsedIngredient.quantity * scaleFactor;

    return {
        ...parsedIngredient,
        quantity: newQuantity,
        scaleFactor: scaleFactor,
    }
}

// Convert scaled ingredient back to string
export const formatIngredient = (parsedIngredient, useOptimalUnits = true) => {
  const { quantity, unit, name } = parsedIngredient;

  let finalQuantity = quantity;
  let finalUnit = unit;

  // Remove smart unit conversion to avoid circular dependency
  // This can be handled in the component if needed
  
  const formattedQuantity = formatQuantity(finalQuantity);
  const pluralUnit = finalQuantity === 1 ? finalUnit : finalUnit + 's'; // Simple pluralization

  return `${formattedQuantity} ${pluralUnit} ${name}`;
};
