export const UNIT_CONVERSIONS = {
  // Volume conversions (all to milliliters as base)
  volume: {
    ml: 1,
    milliliter: 1,
    milliliters: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    cup: 236.588,
    cups: 236.588,
    tbsp: 14.7868,
    tablespoon: 14.7868,
    tablespoons: 14.7868,
    tsp: 4.92892,
    teaspoon: 4.92892,
    teaspoons: 4.92892,
    "fl oz": 29.5735,
    "fluid ounce": 29.5735,
    "fluid ounces": 29.5735,
    pint: 473.176,
    pints: 473.176,
    quart: 946.353,
    quarts: 946.353,
    gallon: 3785.41,
    gallons: 3785.41,
  },

  // Weight conversions (all to grams as base)
  weight: {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    oz: 28.3495,
    ounce: 28.3495,
    ounces: 28.3495,
    lb: 453.592,
    pound: 453.592,
    pounds: 453.592
  },

  // Count/pieces items (no conversion needed)
  count: {
    piece: 1,
    pieces: 1,
    item: 1,
    items: 1,
    clove: 1,
    cloves: 1,
    slice: 1,
    slices: 1,
    sheet: 1,
    sheets: 1
  }
};

// Determine unit category
export const getUnitCategory = (unit) => {
    const normalizedUnit = unit.toLowerCase().trim(); // Normalize unit string

    if(UNIT_CONVERSIONS.volume[normalizedUnit]) return 'volume';
    if(UNIT_CONVERSIONS.weight[normalizedUnit]) return 'weight';
    if(UNIT_CONVERSIONS.count[normalizedUnit]) return 'count';
    return 'unknown';
}

// Convert between units within the same category
export const convertUnits = (value, fromUnit, toUnit) => {
    const fromCategory = getUnitCategory(fromUnit); // Determine category of fromUnit
    const toCategory = getUnitCategory(toUnit); // Determine category of toUnit

    // Can only convert within the same category
    if(fromCategory !== toCategory || fromCategory === 'unknown'){
        return { value, unit: fromUnit, error: 'Cannot convert between different unit types' };
    }

    const conversionTable = UNIT_CONVERSIONS[fromCategory]; // Get the relevant conversion table
    const fromNormalized = fromUnit.toLowerCase().trim(); // Normalize fromUnit
    const toNormalized = toUnit.toLowerCase().trim(); // Normalize toUnit

    // Convert to base unit, then to target unit
    const baseValue = value * conversionTable[fromNormalized]; // Convert to base unit
    const convertedValue = baseValue / conversionTable[toNormalized]; // Convert to target unit

    return {
        value: Math.round(convertedValue * 100) / 100, // Round to 2 decimal places
        unit: toUnit,
        error: null
    }
}


// Get appropriate display unit for a given value and unit
export const getOptimalUnit = (value, unit) => {
    const category = getUnitCategory(unit); // Determine category of the unit
    if(category === 'volume'){
        const mlValue = value * UNIT_CONVERSIONS.volume[unit.toLowerCase().trim()]; // Convert to ml

        if(mlValue < 15) return 'tsp';
        if(mlValue < 60) return 'tbsp';
        if(mlValue < 1000) return 'cup';
        return 'l';
    }

    if(category === 'weight'){
        // Convert very light weight to grams, heavy to kg
        const gramValue = value * UNIT_CONVERSIONS.weight[unit.toLowerCase().trim()]; // Convert to grams

        if(gramValue < 1000) return 'g'; // Use grams for weights under 1kg
        return 'kg'; // Use kg for weights 1kg and above
    }
    return unit; // No optimal unit for count or unknown types
}

// Smart unit conversion that chooses optimal display unit
export const smartConvertUnits = (value, unit, scaleFactor) => {
    const scaledValue = value * scaleFactor; // Scale the original value
    const optimalUnit = getOptimalUnit(scaledValue, unit); // Determine optimal unit for scaled value

    if(optimalUnit === unit){
        return {
            value: Math.round(scaledValue * 100) / 100, // Round to 2 decimal places
            unit: unit,
            error: null
        }
    }
    return convertUnits(scaledValue, unit, optimalUnit); // Convert to optimal unit
}
