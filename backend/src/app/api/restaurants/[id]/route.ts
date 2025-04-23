// app/api/restaurants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();

    const restaurant = await db.collection('restaurants').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { restaurantName: 1, menuItems: 1 } }
    );

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: restaurant.restaurantName,
      menuItems: restaurant.menuItems,
    });
  } catch (error) {
    console.error('GET /api/restaurant/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
