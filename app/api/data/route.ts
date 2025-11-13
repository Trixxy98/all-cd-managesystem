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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    console.log('API Parameters:', { page, limit, region, search, offset });

    // Build query
    let whereConditions: string[] = [];
    let queryParams: any[] = [limit, offset];
    let paramCount = 3;

    if (region) {
      whereConditions.push(`sheet_name = $${paramCount}`);
      queryParams.push(region);
      paramCount++;
    }

    if (search) {
      const searchCondition = `(
        node ILIKE $${paramCount} OR 
        ne_ip ILIKE $${paramCount} OR 
        idu ILIKE $${paramCount} OR 
        capacity ILIKE $${paramCount} OR 
        location ILIKE $${paramCount} OR
        site_id_a ILIKE $${paramCount} OR
        site_id_b ILIKE $${paramCount}
      )`;
      whereConditions.push(searchCondition);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get paginated data
    const dataQuery = `
      SELECT 
        id, node, ne_ip, idu, capacity, location, main_stby,
        site_id_a, site_id_b, protection, sheet_name, created_at
      FROM network_data 
      ${whereClause}
      ORDER BY id DESC 
      LIMIT $1 OFFSET $2
    `;

    // Get total count - use same WHERE conditions but different parameters
    const countQuery = `
      SELECT COUNT(*) as total_count FROM network_data 
      ${whereClause}
    `;

    console.log('Data Query:', dataQuery);
    console.log('Count Query:', countQuery);
    console.log('Query Params:', queryParams);

    // For count query, we need the WHERE parameters but not LIMIT/OFFSET
    const countParams = queryParams.slice(2); // Remove $1 (limit) and $2 (offset)

    const [dataResult, countResult] = await Promise.all([
      query(dataQuery, queryParams),
      query(countQuery, countParams)
    ]);

    console.log('Data result count:', dataResult.rows.length);
    console.log('Total count result:', countResult.rows[0]);

    const total = parseInt(countResult.rows[0]?.total_count || '0');
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      { error: `Failed to load data: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}