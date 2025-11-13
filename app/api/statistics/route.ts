import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get total records count
    const totalResult = await query('SELECT COUNT(*) as total FROM network_data');
    const total = parseInt(totalResult.rows[0].total);

    // Get records by region
    const regionStats = await query(`
      SELECT sheet_name as region, COUNT(*) as count 
      FROM network_data 
      GROUP BY sheet_name 
      ORDER BY count DESC
    `);

    // Get records by capacity type
    const capacityStats = await query(`
      SELECT capacity, COUNT(*) as count 
      FROM network_data 
      WHERE capacity IS NOT NULL AND capacity != ''
      GROUP BY capacity 
      ORDER BY count DESC 
      LIMIT 10
    `);

    // Get weekly import stats
    const weeklyStats = await query(`
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as count
      FROM network_data 
      GROUP BY week 
      ORDER BY week DESC 
      LIMIT 8
    `);

    // Get latest imports
    const latestImports = await query(`
      SELECT 
        region, 
        file_name,
        import_date,
        created_at,
        (SELECT COUNT(*) FROM network_data WHERE session_id = import_sessions.id) as record_count
      FROM import_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    return NextResponse.json({
      totalRecords: total,
      regionStats: regionStats.rows,
      capacityStats: capacityStats.rows,
      weeklyStats: weeklyStats.rows,
      latestImports: latestImports.rows,
    });

  } catch (error) {
    console.error('Statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}