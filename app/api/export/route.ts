import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

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
    const region = searchParams.get('region');
    const format = searchParams.get('format') || 'excel';

    // Build query
    let whereClause = '';
    const queryParams: any[] = [];

    if (region) {
      whereClause = 'WHERE sheet_name = $1';
      queryParams.push(region);
    }

    const dataQuery = `
      SELECT 
        node, ne_ip, idu, capacity, location, parallel, main_stby,
        site_id_a, lrd_a, site_id_b, lrd_b, uplink, link_count, protection,
        remote_ip, remote_slot, l3_port, ras, hostname, link, qam, sheet_name,
        created_at
      FROM network_data 
      ${whereClause}
      ORDER BY id DESC
    `;

    const result = await query(dataQuery, queryParams);

    if (format === 'excel') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(result.rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'NetworkData');
      
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="network-data-${region || 'all'}-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else {
      // CSV format
      const headers = Object.keys(result.rows[0] || {}).join(',');
      const csvData = result.rows.map(row => 
        Object.values(row).map(field => 
          `"${String(field).replace(/"/g, '""')}"`
        ).join(',')
      ).join('\n');
      
      const csv = `${headers}\n${csvData}`;
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="network-data-${region || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}