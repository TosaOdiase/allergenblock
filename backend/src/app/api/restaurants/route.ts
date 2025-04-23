import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const restaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1, restaurantName: 1 })
      .toArray();

    const formattedRestaurants = restaurants.map(restaurant => ({
      id: restaurant._id.toString(),
      name: restaurant.restaurantName
    }));

    return NextResponse.json(formattedRestaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
} 