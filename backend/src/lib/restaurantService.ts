import { connectToDatabase } from "./mongodb";
import { checkGoogleMapsRestaurant } from "./mapsService";
import { storeMenuContext } from "./menuService";

/**
 * Stores restaurant information and menu context in MongoDB
 * @param restaurantName - Name of the restaurant from camera
 * @param location - Location coordinates from camera
 * @param menuItems - Array of menu items with allergens from camera
 * @param source - Source of the data (must be 'camera' for storage)
 */
export async function storeRestaurantInfo(
  restaurantName: string,
  location: {lat: number, lng: number},
  menuItems: Array<{name: string, allergens: string[]}>,
  source: 'camera' | 'manual'
) {
  try {
    // Only proceed with storage if the source is from camera
    if (source !== 'camera') {
      console.log('Skipping storage - data not from camera:', { restaurantName, source });
      return;
    }

    const db = await connectToDatabase();
    
    // First verify if the restaurant exists in Google Maps at this location
    const exists = await checkGoogleMapsRestaurant(restaurantName, location);
    
    if (exists) {
      // Restaurant exists in Google Maps at this location
      // Only store the menu context, don't store restaurant info
      console.log('Restaurant found in Google Maps, only storing menu context:', restaurantName);
      await storeMenuContext(restaurantName, location, menuItems);
    } else {
      // Restaurant not found in Google Maps at this location
      // Store both restaurant info and menu context
      console.log('Restaurant not found in Google Maps, storing both restaurant info and menu context:', restaurantName);
      
      // Store restaurant information
      await db.collection("restaurants").insertOne({
        restaurantName,
        location: {
          type: "Point",
          coordinates: [location.lng, location.lat]
        },
        source: 'camera',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Store menu context
      await storeMenuContext(restaurantName, location, menuItems);
    }
    
    console.log('Successfully processed restaurant data from camera:', restaurantName);
    return true;
  } catch (error) {
    console.error('Error processing restaurant data:', error);
    throw error;
  }
}

/**
 * Retrieves restaurant information from the database
 * @param restaurantName - Name of the restaurant
 * @param location - Location coordinates
 * @returns Restaurant information or null if not found
 */
export async function getRestaurantInfo(
  restaurantName: string,
  location: {lat: number, lng: number}
) {
  try {
    const db = await connectToDatabase();
    return db.collection("restaurants").findOne({
      restaurantName,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
          $maxDistance: 100,
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving restaurant info:', error);
    return null;
  }
} 