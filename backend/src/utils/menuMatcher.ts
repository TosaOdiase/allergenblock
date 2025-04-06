import { calculateStringSimilarity } from "@/utils/stringSimilarity";

/**
 * Finds the best matching menu from a list based on string similarity
 * @param menus - Array of menu documents, each with a 'restaurantName'
 * @param targetName - The user's input restaurant name
 * @param threshold - Minimum similarity (0.0 - 1.0) for an acceptable match
 * @returns The best matching menu (or null if below threshold)
 */
export function findBestMatchingMenu(
  menus: any[], // TODO: specify type
  targetName: string,
  threshold = 0.8
) {
  let bestMatch = null;
  let bestScore = 0;

  for (const menu of menus) {
    const similarity = calculateStringSimilarity(menu.restaurantName, targetName);
    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = menu;
    }
  }

  return bestMatch;
}
