import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const connectionTest = await query('SELECT NOW() as current_time');
    
    // Test table exists and has data
    const tableTest = await query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT sheet_name) as regions
      FROM network_data
    `);

    // Get some sample regions
    const regionsResult = await query(`
      SELECT DISTINCT sheet_name as region, COUNT(*) as count
      FROM network_data 
      GROUP BY sheet_name 
      ORDER BY count DESC
      LIMIT 10
    `);

    return NextResponse.json({
      connection: '✅ Connected to PostgreSQL',
      currentTime: connectionTest.rows[0].current_time,
      tableStats: tableTest.rows[0],
      regions: regionsResult.rows,
      message: 'Database is ready for search functionality'
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}