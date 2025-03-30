import { NextRequest, NextResponse } from 'next/server';
import { scrapeStatic } from '../menu/scrapeStatic';
import { scrapeDynamic } from '../menu/scrapeDynamic';
import { classifyMenuItem } from '../menu/classifyMenuItem';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json();
    console.log('📍 Received location:', location);

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ error: 'No restaurants found' }, { status: 404 });
    }

    const restaurants = await Promise.all(
      searchData.results.slice(0, 5).map(async (place: any) => {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,website,url&key=${GOOGLE_MAPS_API_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const menuUrl = detailData?.result?.website || detailData?.result?.url || null;

        let rawItems: string[] = [];
        let usedSource = 'none';

        if (menuUrl) {
          try {
            rawItems = await scrapeStatic(menuUrl);
            usedSource = 'static';

            if (rawItems.length === 0) {
              console.log('🧪 Trying dynamic scrape...');
              rawItems = await scrapeDynamic(menuUrl);
              usedSource = 'dynamic';
            }
          } catch (err) {
            console.warn(`❌ Scraping failed for ${menuUrl}`);
          }
        }

        console.log(`📦 Raw items from ${menuUrl}:`, rawItems);

        const classifiedItems = rawItems.map(text => {
          const { confidence, classification } = classifyMenuItem(text);
          return {
            text,
            source: usedSource,
            confidence,
            classification
          };
        });

        return {
          name: place.name,
          address: place.formatted_address || place.vicinity,
          menuUrl,
          menuItems: classifiedItems,
          summary: 'Debug: classification enabled'
        };
      })
    );

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('❌ Error in debug route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
