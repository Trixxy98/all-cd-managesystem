import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const region = formData.get('region') as string;

    if (!file || !region) {
      return NextResponse.json(
        { error: 'File and region are required' },
        { status: 400 }
      );
    }

    // Validate region
    const validRegions = ['Central', 'Northern', 'Eastern', 'Southern', 'EM'];
    if (!validRegions.includes(region)) {
      return NextResponse.json(
        { error: 'Invalid region' },
        { status: 400 }
      );
    }

    // Read and parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Check if Summary1 or summary1 sheet exists (case insensitive)
    const sheetNames = workbook.SheetNames;
    const targetSheet = sheetNames.find(name => 
      name.toLowerCase() === 'summary1'
    );

    if (!targetSheet) {
      return NextResponse.json(
        { error: 'The sheet "Summary1" does not exist in the uploaded file. Available sheets: ' + sheetNames.join(', ') },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[targetSheet];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('Found sheet:', targetSheet);
    console.log('Excel data preview:', data.slice(0, 3)); // Debug first 3 rows
    console.log('Header row:', data[0]); // Debug header row

    // Create import session
    const sessionResult = await client.query(
      `INSERT INTO import_sessions (user_id, region, file_name, import_date) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [decoded.userId, region, file.name, new Date().toISOString().split('T')[0]]
    );

    const sessionId = sessionResult.rows[0].id;

    // Process and insert data
    const headerRow = data[0] as string[];
    const rowsToInsert = [];
    
    // Simple column mapping - adjust based on your actual Excel structure
    const columnMap = {
      node: 0,        // First column
      neIp: 1,        // Second column  
      idu: 2,         // Third column
      capacity: 3,    // Fourth column
      location: 4,    // Fifth column
      parallel: 5,    // Sixth column
      mainStby: 6,    // Seventh column
      siteIdA: 7,     // Eighth column
      lrdA: 8,        // Ninth column
      siteIdB: 9,     // Tenth column
      lrdB: 10,       // Eleventh column
      uplink: 11,     // Twelfth column
      linkCount: 12,  // Thirteenth column
      protection: 13, // Fourteenth column
      remoteIp: 14,   // Fifteenth column
      remoteSlot: 15, // Sixteenth column
      l3Port: 16,     // Seventeenth column
      ras: 17,        // Eighteenth column
      hostname: 18,   // Nineteenth column
      link: 19,       // Twentieth column
      qam: 20         // Twenty-first column
    };

    let rowCount = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        continue;
      }

      const rowData = {
        sessionId,
        sheetName: region,
        node: row[columnMap.node],
        neIp: row[columnMap.neIp],
        idu: row[columnMap.idu],
        capacity: row[columnMap.capacity],
        location: row[columnMap.location],
        parallel: row[columnMap.parallel],
        mainStby: row[columnMap.mainStby],
        siteIdA: row[columnMap.siteIdA],
        lrdA: row[columnMap.lrdA],
        siteIdB: row[columnMap.siteIdB],
        lrdB: row[columnMap.lrdB],
        uplink: row[columnMap.uplink],
        linkCount: row[columnMap.linkCount],
        protection: row[columnMap.protection],
        remoteIp: row[columnMap.remoteIp],
        remoteSlot: row[columnMap.remoteSlot],
        l3Port: row[columnMap.l3Port],
        ras: row[columnMap.ras],
        hostname: row[columnMap.hostname],
        link: row[columnMap.link],
        qam: row[columnMap.qam],
      };

      rowsToInsert.push(rowData);
      rowCount++;

      // Insert in batches of 50 for better performance
      if (rowsToInsert.length >= 50) {
        await insertBatch(client, rowsToInsert);
        rowsToInsert.length = 0;
      }
    }

    // Insert remaining rows
    if (rowsToInsert.length > 0) {
      await insertBatch(client, rowsToInsert);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      message: `Data imported successfully for ${region} region from sheet "${targetSheet}"`,
      sessionId,
      rowCount,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please check the file format and try again.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

async function insertBatch(client: any, data: any[]) {
  if (data.length === 0) return;

  const values = [];
  const placeholders = [];
  let paramCount = 1;

  const columns = [
    'session_id', 'sheet_name', 'node', 'ne_ip', 'idu', 'capacity', 'location',
    'parallel', 'main_stby', 'site_id_a', 'lrd_a', 'site_id_b', 'lrd_b',
    'uplink', 'link_count', 'protection', 'remote_ip', 'remote_slot', 'l3_port',
    'ras', 'hostname', 'link', 'qam'
  ];

  for (const row of data) {
    const rowPlaceholders = [];
    for (const col of columns) {
      const key = col === 'session_id' ? 'sessionId' : 
                  col === 'ne_ip' ? 'neIp' :
                  col === 'main_stby' ? 'mainStby' :
                  col === 'site_id_a' ? 'siteIdA' :
                  col === 'lrd_a' ? 'lrdA' :
                  col === 'site_id_b' ? 'siteIdB' :
                  col === 'lrd_b' ? 'lrdB' :
                  col === 'link_count' ? 'linkCount' :
                  col === 'remote_ip' ? 'remoteIp' :
                  col === 'remote_slot' ? 'remoteSlot' :
                  col === 'l3_port' ? 'l3Port' : 
                  col === 'sheet_name' ? 'sheetName' : col;
      
      values.push(row[key] || null);
      rowPlaceholders.push(`$${paramCount}`);
      paramCount++;
    }
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const queryText = `
    INSERT INTO network_data (
      ${columns.join(', ')}
    ) VALUES ${placeholders.join(', ')}
  `;

  await client.query(queryText, values);
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '25mb',
  },
};