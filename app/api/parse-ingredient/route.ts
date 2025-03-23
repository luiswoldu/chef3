import { NextResponse } from 'next/server';

// Common unit patterns
const UNIT_PATTERNS = {
  volume: ['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'tbsps', 'teaspoon', 'teaspoons', 'tsp', 'tsps', 'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons', 'ml', 'l'],
  weight: ['pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz', 'gram', 'grams', 'g', 'kilogram', 'kilograms', 'kg'],
  count: ['whole', 'piece', 'pieces', 'pinch', 'pinches', 'dash', 'dashes', 'drop', 'drops'],
  temperature: ['degree', 'degrees', '°F', '°C', 'F', 'C'],
};

// Common preparation methods
const PREP_METHODS = [
  'chopped', 'diced', 'sliced', 'minced', 'grated', 'crushed', 'crumbled', 'fresh', 'frozen', 'canned',
  'dried', 'roasted', 'toasted', 'cooked', 'raw', 'peeled', 'seeded', 'stemmed', 'trimmed', 'washed',
  'drained', 'rinsed', 'divided', 'optional', 'garnish'
];

// Common adjectives that should be part of the name
const INGREDIENT_ADJECTIVES = [
  'fresh', 'frozen', 'canned', 'dried', 'ripe', 'unripe', 'green', 'red', 'yellow', 'white', 'black',
  'brown', 'organic', 'wild', 'baby', 'large', 'small', 'medium', 'extra', 'lean', 'fat-free'
];

// Common alternative indicators
const ALTERNATIVE_INDICATORS = [
  'like', 'such as', 'for example', 'or', 'alternatively', 'preferably', 'ideally'
];

interface ParsedIngredient {
  name: string;
  amount: string;
  details: string;
  alternatives: string[];
  original: string;
}

export async function POST(request: Request) {
  try {
    const { ingredient } = await request.json();

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient text is required' }, { status: 400 });
    }

    // Clean the ingredient string
    const cleanIngredient = ingredient.trim().replace(/\s+/g, ' ');

    // Initialize the parsed ingredient object
    const parsedIngredient: ParsedIngredient = {
      name: '',
      amount: '',
      details: '',
      alternatives: [],
      original: cleanIngredient
    };

    // Extract amount and unit
    let amount = '';
    let unit = '';
    let remainingText = cleanIngredient;

    // Match numbers and fractions at the start
    const numberMatch = cleanIngredient.match(/^([\d\s/]+)/);
    if (numberMatch) {
      amount = numberMatch[1].trim();
      remainingText = cleanIngredient.substring(amount.length).trim();
    }

    // Find unit
    const unitRegex = new RegExp(`\\b(${Object.values(UNIT_PATTERNS).flat().join('|')})\\b`, 'i');
    const unitMatch = remainingText.match(unitRegex);
    if (unitMatch) {
      unit = unitMatch[1];
      remainingText = remainingText.replace(new RegExp(`\\b${unit}\\b`, 'i'), '').trim();
    }

    // Combine amount and unit
    parsedIngredient.amount = amount + (unit ? ` ${unit}` : '');

    // Find alternatives (e.g., "like shells, rigatoni or bowtie")
    for (const indicator of ALTERNATIVE_INDICATORS) {
      const altRegex = new RegExp(`${indicator}\\s+([^,]+)`, 'i');
      const altMatch = remainingText.match(altRegex);
      if (altMatch) {
        const alternativesText = altMatch[1];
        parsedIngredient.alternatives = alternativesText
          .split(/[,]|\s+or\s+/)
          .map((alt: string) => alt.trim())
          .filter((alt: string) => alt.length > 0);
        remainingText = remainingText.replace(altRegex, '').trim();
      }
    }

    // Split remaining text into words
    const words = remainingText.split(' ');
    const nameWords: string[] = [];
    const detailWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      // Check if word is a preparation method
      if (PREP_METHODS.includes(word)) {
        detailWords.push(words[i]);
        continue;
      }

      // Check if word is an adjective that should be part of the name
      if (INGREDIENT_ADJECTIVES.includes(word)) {
        nameWords.push(words[i]);
        continue;
      }

      // If we haven't added this word to name or details yet, add it to name
      if (!nameWords.includes(words[i]) && !detailWords.includes(words[i])) {
        nameWords.push(words[i]);
      }
    }

    // Combine words into name and details
    parsedIngredient.name = nameWords.join(' ').trim();
    parsedIngredient.details = detailWords.join(' ').trim();

    // If we couldn't extract a name, use the original ingredient
    if (!parsedIngredient.name) {
      parsedIngredient.name = cleanIngredient;
    }

    // Return only the fields we need
    return NextResponse.json({
      name: parsedIngredient.name,
      amount: parsedIngredient.amount,
      details: parsedIngredient.details
    });

  } catch (error: any) {
    console.error('Error parsing ingredient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 