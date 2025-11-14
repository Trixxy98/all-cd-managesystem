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

    console.log('📡 API called with:', { page, limit, region, search });

    // SIMPLE AND SAFE APPROACH - No complex parameter building
    let dataQuery = '';
    let countQuery = '';
    let dataParams: any[] = [];
    let countParams: any[] = [];

    if (region && search) {
      // Case 1: Both region and search
      dataQuery = `
        SELECT id, node, ne_ip, idu, capacity, location, main_stby,
               site_id_a, site_id_b, protection, sheet_name, created_at
        FROM network_data 
        WHERE sheet_name = $1 AND (
          node ILIKE $2 OR ne_ip ILIKE $2 OR idu ILIKE $2 OR 
          capacity ILIKE $2 OR location ILIKE $2 OR
          site_id_a ILIKE $2 OR site_id_b ILIKE $2
        )
        ORDER BY id DESC 
        LIMIT $3 OFFSET $4
      `;
      countQuery = `
        SELECT COUNT(*) as total FROM network_data 
        WHERE sheet_name = $1 AND (
          node ILIKE $2 OR ne_ip ILIKE $2 OR idu ILIKE $2 OR 
          capacity ILIKE $2 OR location ILIKE $2 OR
          site_id_a ILIKE $2 OR site_id_b ILIKE $2
        )
      `;
      dataParams = [region, `%${search}%`, limit, offset];
      countParams = [region, `%${search}%`];
      
    } else if (region) {
      // Case 2: Only region
      dataQuery = `
        SELECT id, node, ne_ip, idu, capacity, location, main_stby,
               site_id_a, site_id_b, protection, sheet_name, created_at
        FROM network_data 
        WHERE sheet_name = $1
        ORDER BY id DESC 
        LIMIT $2 OFFSET $3
      `;
      countQuery = `SELECT COUNT(*) as total FROM network_data WHERE sheet_name = $1`;
      dataParams = [region, limit, offset];
      countParams = [region];
      
    } else if (search) {
      // Case 3: Only search
      dataQuery = `
        SELECT id, node, ne_ip, idu, capacity, location, main_stby,
               site_id_a, site_id_b, protection, sheet_name, created_at
        FROM network_data 
        WHERE (
          node ILIKE $1 OR ne_ip ILIKE $1 OR idu ILIKE $1 OR 
          capacity ILIKE $1 OR location ILIKE $1 OR
          site_id_a ILIKE $1 OR site_id_b ILIKE $1
        )
        ORDER BY id DESC 
        LIMIT $2 OFFSET $3
      `;
      countQuery = `
        SELECT COUNT(*) as total FROM network_data 
        WHERE (
          node ILIKE $1 OR ne_ip ILIKE $1 OR idu ILIKE $1 OR 
          capacity ILIKE $1 OR location ILIKE $1 OR
          site_id_a ILIKE $1 OR site_id_b ILIKE $1
        )
      `;
      dataParams = [`%${search}%`, limit, offset];
      countParams = [`%${search}%`];
      
    } else {
      // Case 4: No filters
      dataQuery = `
        SELECT id, node, ne_ip, idu, capacity, location, main_stby,
               site_id_a, site_id_b, protection, sheet_name, created_at
        FROM network_data 
        ORDER BY id DESC 
        LIMIT $1 OFFSET $2
      `;
      countQuery = `SELECT COUNT(*) as total FROM network_data`;
      dataParams = [limit, offset];
      countParams = [];
    }

    console.log('📊 Data Query:', dataQuery);
    console.log('🔢 Data Params:', dataParams);
    console.log('📊 Count Query:', countQuery);
    console.log('🔢 Count Params:', countParams);

    // Execute queries
    const dataResult = await query(dataQuery, dataParams);
    const countResult = await query(countQuery, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log('✅ Success - Found', dataResult.rows.length, 'records out of', total);

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
    console.error('❌ Data API error:', error);
    return NextResponse.json(
      { error: `Failed to load data: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}