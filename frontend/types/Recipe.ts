export type Ingredient = {
    name: string;
    amount: number;
    unit: string;
  };
  
  export type Recipe = {
    id: number;
    title: string;
    notes: string;
    image_url: string;
    categories: string[];
    ingredients: Ingredient[];
  };