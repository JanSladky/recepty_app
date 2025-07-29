import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { 
    getAllRecipes,
    getFavoriteRecipeIdsForUser, 
    addFavoriteInDB, 
    removeFavoriteInDB,
    getIngredientsForRecipes
} from "../models/recipeModel";
import type { IngredientInput } from "../models/recipeModel";

// Získá všechny oblíbené recepty a IDčka pro přihlášeného uživatele
export const getMyFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: "Neautorizovaný přístup" });
        return;
    }
    try {
        const allRecipes = await getAllRecipes();
        const favoriteIds = await getFavoriteRecipeIdsForUser(req.user.id);
        const favoriteRecipes = allRecipes.filter(recipe => favoriteIds.includes(recipe.id));
        
        res.status(200).json({ favorites: favoriteRecipes, favoriteIds });
    } catch (error) {
        res.status(500).json({ error: "Chyba při načítání oblíbených receptů" });
    }
};

// Přepne stav oblíbenosti (přidá/odebere)
export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: "Neautorizovaný přístup" });
        return;
    }
    const recipeId = Number(req.params.id);
    try {
        const favoriteIds = await getFavoriteRecipeIdsForUser(req.user.id);
        if (favoriteIds.includes(recipeId)) {
            await removeFavoriteInDB(req.user.id, recipeId);
            res.status(200).json({ message: "Recept odebrán z oblíbených", isFavorite: false });
        } else {
            await addFavoriteInDB(req.user.id, recipeId);
            res.status(200).json({ message: "Recept přidán do oblíbených", isFavorite: true });
        }
    } catch (error) {
        res.status(500).json({ error: "Chyba při změně stavu oblíbenosti" });
    }
};

// Vygeneruje nákupní seznam
export const generateShoppingList = async (req: Request, res: Response): Promise<void> => {
    // OPRAVA: Explicitně říkáme TypeScriptu, jaký typ má req.body
    const { recipeIds } = req.body as { recipeIds: number[] };
    
    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        res.status(400).json({ error: "Chybí ID receptů" });
        return;
    }
    try {
        const ingredients = await getIngredientsForRecipes(recipeIds);
        
        const shoppingList: { [key: string]: { amount: number; unit: string } } = {};
        
        ingredients.forEach(ing => {
            const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`;
            if (shoppingList[key]) {
                shoppingList[key].amount += ing.amount;
            } else {
                shoppingList[key] = { amount: ing.amount, unit: ing.unit };
            }
        });

        const formattedList = Object.values(shoppingList).map(value => {
            const key = Object.keys(shoppingList).find(k => shoppingList[k] === value) || '';
            const name = key.split('_')[0];
            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                amount: value.amount,
                unit: value.unit
            };
        });

        res.status(200).json(formattedList);
    } catch (error) {
        res.status(500).json({ error: "Chyba při generování nákupního seznamu" });
    }
};