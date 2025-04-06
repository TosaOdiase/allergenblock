import { connectToDatabase } from "./mongodb";
import { calculateStringSimilarity } from "../utils/stringSimilarity";

/** 1) EXACT MATCH */
export async function getExactMenuMatch(
  restaurantName: string,
  location: { lat: number; lng: number }
) {
  const db = await connectToDatabase();
  return db.collection("menus").findOne({
    restaurantName,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
        $maxDistance: 100,
      },
    },
  });
}

/** 2) ALL NEARBY MENUS */
export async function findNearbyMenus(
  location: { lat: number; lng: number }
) {
  const db = await connectToDatabase();
  return db.collection("menus").find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
        $maxDistance: 100,
      },
    },
  }).toArray();
}

/** 3) UTILITY: Best match from an array */
function findBestMatchingMenu(
  menus: any[],
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

/** 4) GET MENU CONTEXT */
export async function getMenuContext(
  restaurantName: string,
  location: { lat: number; lng: number }
): Promise<{ items: Array<{ name: string; allergens: string[] }> } | null> {
  console.log("🍽️ Getting menu context for:", { restaurantName, location });

  try {
    // A. Exact match
    const exactMenu = await getExactMenuMatch(restaurantName, location);
    if (exactMenu) {
      return { items: exactMenu.menuItems };
    }

    // B. No exact? Fallback to best match
    console.log("No exact match, searching for similar...");
    const menus = await findNearbyMenus(location);
    const bestMatch = findBestMatchingMenu(menus, restaurantName);

    return bestMatch ? { items: bestMatch.menuItems } : null;
  } catch (error) {
    console.error("❌ Error fetching menu context:", error);
    throw error;
  }
}

/** 5) STORE MENU CONTEXT */
export async function storeMenuContext(
  restaurantName: string,
  location: { lat: number; lng: number },
  menuContext: Array<{ name: string; allergens: string[] }>
): Promise<boolean> {
  console.log("💾 Storing menu data:", { restaurantName, location, menuContext });

  try {
    const db = await connectToDatabase();
    await db.collection("menus").insertOne({
      restaurantName,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat],
      },
      menuItems: menuContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Menu data stored");
    return true;
  } catch (error) {
    console.error("❌ Error storing menu context:", error);
    return false;
  }
}
