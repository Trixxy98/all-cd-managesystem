// app/api/statistics/capacity/route.ts
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

    // Get capacity distribution
    const capacityStats = await query(`
      SELECT 
        capacity,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM network_data), 2) as percentage
      FROM network_data 
      WHERE capacity IS NOT NULL AND capacity != ''
      GROUP BY capacity 
      ORDER BY count DESC
      LIMIT 15
    `);

    // Get capacity by region
    const capacityByRegion = await query(`
      SELECT 
        sheet_name as region,
        capacity,
        COUNT(*) as count
      FROM network_data 
      WHERE capacity IS NOT NULL AND capacity != ''
        AND sheet_name IN ('Central', 'Northern', 'Eastern', 'Southern', 'EM')
      GROUP BY sheet_name, capacity
      ORDER BY sheet_name, count DESC
    `);

    // Get monthly capacity trends
    const monthlyTrends = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        capacity,
        COUNT(*) as count
      FROM network_data 
      WHERE capacity IS NOT NULL AND capacity != ''
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, capacity
      ORDER BY month, count DESC
    `);

    return NextResponse.json({
      capacityDistribution: capacityStats.rows,
      capacityByRegion: capacityByRegion.rows,
      monthlyTrends: monthlyTrends.rows,
    });

  } catch (error) {
    console.error('Capacity statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity statistics' },
      { status: 500 }
    );
  }
}