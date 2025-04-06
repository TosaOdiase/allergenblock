// lib/mapsService.ts

import { calculateStringSimilarity } from "@/utils/stringSimilarity";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

/**
 * Checks if a restaurant exists in Google Maps at the given location,
 * returning true if we have a similarity >= 0.8 (or 0.95 for exact).
 */
export async function checkGoogleMapsRestaurant(
  restaurantName: string,
  location: { lat: number; lng: number }
): Promise<boolean> {
  try {
    const baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: "100",
      type: "restaurant",
      keyword: restaurantName,
      key: GOOGLE_MAPS_API_KEY,
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log("🔍 Checking Google Maps for:", { restaurantName, location });

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      let bestScore = 0;

      for (const place of data.results) {
        const similarity = calculateStringSimilarity(place.name, restaurantName);
        if (similarity > bestScore) {
          bestScore = similarity;
        }
      }

      console.log(`🔎 Best match score: ${bestScore}`);
      // Example thresholds
      if (bestScore >= 0.8) {
        console.log("👍 Similar or exact match found on Google Maps");
        return true;
      }
    }

    console.log("❌ No matching restaurant found in Google Maps");
    return false;
  } catch (error) {
    console.error("Error checking Google Maps:", error);
    return false;
  }
}

/**
 * Gets nearby restaurants from Google Maps within 500m
 */
export async function getNearbyRestaurants(
  location: { lat: number; lng: number }
): Promise<Array<{ name: string; location: { lat: number; lng: number } }>> {
  try {
    const baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: "500",
      type: "restaurant",
      key: GOOGLE_MAPS_API_KEY,
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log("🔍 Getting nearby restaurants from Google Maps:", location);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results.map((place: any) => ({
        name: place.name,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
      }));
    }

    return [];
  } catch (error) {
    console.error("Error getting nearby restaurants:", error);
    return [];
  }
}
