import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/services/seed-db';

export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}