import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

// Test data placeholders
// Created test data to simulate google maps api response for restaurant name and location
/*
const TEST_DATA = {
  restaurantName: "Pizza Palace",
  location: {
    lat: 37.7749,
    lng: -122.4194
  },
  menuContext: {
    items: [
      {
        name: "Margherita Pizza",
        allergens: ["dairy", "gluten"]
      },
      {
        name: "Pepperoni Pizza",
        allergens: ["dairy", "gluten", "pork"]
      },
      {
        name: "Caesar Salad",
        allergens: ["dairy", "fish"]
      }
    ]
  }
};

// Test function to simulate database responses
async function testGetMenuContext(
  restaurantName: string,
  location: {lat: number, lng: number}
): Promise<{
  items: Array<{name: string, allergens: string[]}>;
} | null> {
  // Simulate database lookup by comparing with test data
  if (
    restaurantName === TEST_DATA.restaurantName &&
    location.lat === TEST_DATA.location.lat &&
    location.lng === TEST_DATA.location.lng
  ) {
    return TEST_DATA.menuContext;
  }
  return null;
}
*/

/**
 * Retrieves menu context for a restaurant
 * @param restaurantName - Name of the restaurant
 * @param location - Restaurant's coordinates
 * @returns Promises of menu context or null if menu context is not found
 */
async function getMenuContext(
  restaurantName: string,
  location: {lat: number, lng: number}
): Promise<{
  items: Array<{name: string, allergens: string[]}>;
} | null> {
  console.log('🍽️ Getting menu context for:', { restaurantName, location });
  // Use test function instead of actual database call
  //return testGetMenuContext(restaurantName, location);
  return null;
 
}

/**
 * Stores menu data from camera capture
 * @param restaurantName - Name of the restaurant
 * @param location - Restaurant's coordinates
 * @param menuContext - Array of menu items with names and allergens
 * @returns Promise boolean of success or failure
 */
async function storeMenuContext(
  restaurantName: string,
  location: {lat: number, lng: number},
  menuContext: Array<{name: string, allergens: string[]}>
): Promise<boolean> {
  // TODO: Implement actual database call
  console.log('💾 Storing menu data for:', { restaurantName, location, menuContext });
  return true; // This is a placeholder for the actual database call
}

/**
 * Triggers camera request for menu capture
 * @param restaurantName - Name of the restaurant
 * @param location - Restaurant's coordinates
 * @returns Promise boolean of success or failure
 */
async function requestCameraCapture(
  restaurantName: string,
  location: {lat: number, lng: number}
): Promise<boolean> {
  console.log('📸 Requesting menu capture for:', { restaurantName, location });
  // This would be where we would request the camera capture from the camera
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get the restaurant name and location from the request body as JSON (Google Maps API)
    const { location, restaurantName } = await req.json();

    // Need to confirm that the restaurant name and location are provided
    if (!restaurantName || !location) {
      return NextResponse.json(
        // Return error message if restaurant name and location are not provided
        { error: 'Restaurant name and location are required' },
        { status: 400 }
      );
    }

    console.log('📍 Processing request for:', { restaurantName, location });

    // Attempts to get the menu context from the database
    const menuContext = await getMenuContext(restaurantName, location);

    // If the menu context is found, return the menu context
    if (menuContext) {
      return NextResponse.json({
        restaurantName,
        location,
        menu: menuContext
      });
    }

    // If no menu context exists, trigger camera request
    const cameraRequested = await requestCameraCapture(restaurantName, location);

    // If the camera request fails, return an error
    if (!cameraRequested) {
      return NextResponse.json(
        { error: 'Failed to request menu capture' },
        { status: 500 }
      );
    }

    // If the camera request is successful, return a success message
    return NextResponse.json({
      restaurantName,
      location,
      status: 'camera_requested',
      message: 'Menu capture has been requested'
    });

  } catch (error) {
    console.error('❌ Error in restaurant processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
