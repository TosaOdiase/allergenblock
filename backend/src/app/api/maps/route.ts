import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

// Verify API key is loaded correctly
console.log('Loaded API Key:', GOOGLE_MAPS_API_KEY ? 'Key exists (first 10 chars): ' + GOOGLE_MAPS_API_KEY.substring(0, 10) + '...' : 'No key found');

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json();
    console.log('📍 Received location:', location);

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ No API key found in environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error - No API key',
      }, { status: 500 });
    }

    if (!location) {
      return NextResponse.json({ error: 'Location is required.' }, { status: 400 });
    }

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('🔍 Making request to Places API...');

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    console.log('🔍 Places API Response Status:', searchData.status);
    if (searchData.error_message) {
      console.error('❌ Places API Error Message:', searchData.error_message);
    }

    if (searchData.status !== 'OK') {
      return NextResponse.json({ 
        error: 'Failed to fetch places',
        details: searchData.error_message || searchData.status
      }, { status: 400 });
    }

    if (!searchData.results || searchData.results.length === 0) {
      console.log('⚠️ No results found for location:', location);
      return NextResponse.json({ 
        error: 'No restaurants found for this location',
        location
      }, { status: 404 });
    }

    console.log('✅ Found', searchData.results.length, 'restaurants');
    console.log('🔍 First result:', searchData.results[0].name);

    const restaurants = await Promise.all(
      searchData.results.slice(0, 5).map(async (place: any) => {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,website,url&key=${GOOGLE_MAPS_API_KEY}`;
        
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();

        const details = detailData?.result ?? {};

        return {
          name: place.name,
          address: place.formatted_address || place.vicinity,
          menuUrl: details.website || details.url || null,
        };
      })
    );

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('❌ Error in maps route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
