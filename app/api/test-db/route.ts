// app/api/test-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed' },
      { status: 500 }
    );
  }
}