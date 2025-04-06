import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb"; 
import { calculateStringSimilarity } from "@/utils/stringSimilarity";
import { getMenuContext, storeMenuContext } from "@/lib/menuService";
import { checkGoogleMapsRestaurant, getNearbyRestaurants } from "@/lib/mapsService";
import { findBestMatchingMenu } from "@/utils/menuMatcher";
import { storeRestaurantInfo } from "@/lib/restaurantService";
import { requestCameraCapture } from "@/lib/cameraUploadData";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

/**
 * GET endpoint to retrieve menu data for a specific restaurant and location
 * This endpoint filters menus based on:
 * - Restaurant name (exact match)
 * - Location (within 100 meters radius)
 * 
 * @param {NextRequest} req - The incoming request containing query parameters
 * @returns {Promise<NextResponse>} JSON response containing filtered menu data
 * 
 * Query Parameters:
 * - restaurantName: string (required)
 * - lat: number (required)
 * - lng: number (required)
 * 
 * Example request: /api/maps?restaurantName=Pizza%20Palace&lat=37.7749&lng=-122.4194
 * Example response:
 * {
 *   restaurantName: "Pizza Palace",
 *   location: { lat: 37.7749, lng: -122.4194 },
 *   menuItems: [
 *     { name: "Margherita Pizza", allergens: ["dairy", "gluten"] }
 *   ]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const restaurantName = searchParams.get('restaurantName');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Validate required parameters
    if (!restaurantName || !lat || !lng) {
      return NextResponse.json(
        { error: 'Restaurant name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Get menu context using the service function
    const menuContext = await getMenuContext(
      restaurantName,
      { lat: parseFloat(lat), lng: parseFloat(lng) }
    );

    if (!menuContext) {
      return NextResponse.json(
        { error: 'Menu not found for this restaurant and location' },
        { status: 404 }
      );
    }

    // Return the menu data
    return NextResponse.json(menuContext);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { location, source } = await request.json();
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Get nearby restaurants from Google Maps
    const nearbyRestaurants = await getNearbyRestaurants(location);
    
    // For each restaurant, get its menu context if it exists
    const restaurantsWithMenus = await Promise.all(
      nearbyRestaurants.map(async (restaurant) => {
        const menuContext = await getMenuContext(restaurant.name, restaurant.location);
        return {
          ...restaurant,
          menuContext: menuContext || null
        };
      })
    );

    return NextResponse.json({
      location,
      restaurants: restaurantsWithMenus
    });
  } catch (error) {
    console.error('Error in POST /api/maps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
