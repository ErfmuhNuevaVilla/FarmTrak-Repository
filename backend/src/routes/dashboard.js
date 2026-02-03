const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireAuth");
const XLSX = require("xlsx");

const dashboardRouter = express.Router();

// GET /api/dashboard - Get dashboard statistics (accessible to managers)
dashboardRouter.get("/", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const buildingId = req.query.buildingId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Build WHERE conditions for reports
    let reportWhereConditions = [`DATE(created_at) = $1`];
    let reportParams = [today];
    let paramIndex = 2;

    // Build WHERE conditions for livestock
    let livestockWhereConditions = [];
    let livestockParams = [];

    if (buildingId) {
      reportWhereConditions.push(`building_id = $${paramIndex++}`);
      reportParams.push(buildingId);
      
      livestockWhereConditions.push(`id = $${livestockParams.length + 1}`);
      livestockParams.push(buildingId);
    }

    const reportWhereClause = reportWhereConditions.join(' AND ');
    const livestockWhereClause = livestockWhereConditions.length > 0 
      ? `WHERE ${livestockWhereConditions.join(' AND ')}`
      : '';

    // Get total livestock from buildings
    const livestockResult = await pool.query(
      `SELECT COALESCE(SUM(stock_count), 0) AS total_livestock
       FROM buildings
       ${livestockWhereClause}`,
      livestockParams
    );
    const totalLivestock = Number(livestockResult.rows[0].total_livestock) || 0;

    // Get total egg production from reports (today only)
    const eggResult = await pool.query(
      `SELECT COALESCE(SUM(data_value), 0) AS total_eggs
       FROM reports
       WHERE report_type = 'Egg Harvest' AND ${reportWhereClause}`,
      reportParams
    );
    const totalEggs = Number(eggResult.rows[0].total_eggs) || 0;

    // Calculate egg production percentage
    // Formula: (Daily Eggs × 30 ÷ Total Livestock) × 100 = Daily Production Percentage
    const eggProductionPercent = totalLivestock > 0
      ? ((totalEggs * 30) / totalLivestock) * 100
      : 0;

    // Get total feed used from reports (today only)
    const feedResult = await pool.query(
      `SELECT COALESCE(SUM(data_value), 0) AS total_feed
       FROM reports
       WHERE report_type = 'Feed Usage' AND ${reportWhereClause}`,
      reportParams
    );
    const totalFeed = Number(feedResult.rows[0].total_feed) || 0;

    // Get total mortality from reports (today only)
    const mortalityResult = await pool.query(
      `SELECT COALESCE(SUM(data_value), 0) AS total_mortality
       FROM reports
       WHERE report_type = 'Mortality' AND ${reportWhereClause}`,
      reportParams
    );
    const totalMortality = Number(mortalityResult.rows[0].total_mortality) || 0;

    res.json({
      livestock: totalLivestock,
      eggProduction: Math.round(eggProductionPercent * 100) / 100, // Round to 2 decimal places
      feed: totalFeed,
      mortality: totalMortality
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/egg-trend - Get egg production trend for last 14 days
dashboardRouter.get("/egg-trend", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const buildingId = req.query.buildingId;
    
    // Build WHERE conditions
    let whereConditions = [`report_type = 'Egg Harvest'`, `created_at >= NOW() - INTERVAL '14 days'`];
    let params = [];
    let paramIndex = 1;

    if (buildingId) {
      whereConditions.push(`building_id = $${paramIndex++}`);
      params.push(buildingId);
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COALESCE(SUM(data_value), 0) as eggs
       FROM reports
       WHERE ${whereClause}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 14`,
      params
    );

    // Format data for frontend
    const trendData = result.rows.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      eggs: Number(row.eggs)
    })).reverse(); // Reverse to show oldest to newest

    res.json(trendData);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/building-production - Get daily egg production percentage by building
dashboardRouter.get("/building-production", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT 
         b.id,
         b.name as building_name,
         b.stock_count,
         COALESCE(SUM(CASE WHEN r.report_type = 'Egg Harvest' AND DATE(r.created_at) = $1 THEN r.data_value ELSE 0 END), 0) as daily_eggs
       FROM buildings b
       LEFT JOIN reports r ON b.id = r.building_id
       GROUP BY b.id, b.name, b.stock_count
       ORDER BY b.name`,
      [selectedDate]
    );

    // Calculate production percentage for each building
    // Formula: (Daily Eggs × 30 ÷ Total Stock) × 100 = Daily Production Percentage
    const buildingData = result.rows.map(row => {
      const dailyEggs = Number(row.daily_eggs);
      const stockCount = Number(row.stock_count) || 0;
      
      // Calculate monthly production percentage based on daily rate
      const productionPercentage = stockCount > 0 
        ? ((dailyEggs * 30) / stockCount) * 100 
        : 0;

      return {
        buildingId: row.id,
        buildingName: row.building_name,
        stockCount: stockCount,
        dailyEggs: dailyEggs,
        productionPercentage: Math.round(productionPercentage * 100) / 100 // Round to 2 decimal places
      };
    });

    res.json(buildingData);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/building-feed-usage - Get daily feed usage by building
dashboardRouter.get("/building-feed-usage", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT 
         b.id,
         b.name as building_name,
         b.stock_count,
         COALESCE(SUM(CASE WHEN r.report_type = 'Feed Usage' AND DATE(r.created_at) = $1 THEN r.data_value ELSE 0 END), 0) as feed_usage
       FROM buildings b
       LEFT JOIN reports r ON b.id = r.building_id
       GROUP BY b.id, b.name, b.stock_count
       ORDER BY b.name`,
      [selectedDate]
    );

    const buildingData = result.rows.map(row => ({
      buildingId: row.id,
      buildingName: row.building_name,
      stockCount: Number(row.stock_count) || 0,
      feedUsage: Number(row.feed_usage) || 0
    }));

    res.json(buildingData);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/building-mortality - Get daily mortality by building
dashboardRouter.get("/building-mortality", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT 
         b.id,
         b.name as building_name,
         b.stock_count,
         COALESCE(SUM(CASE WHEN r.report_type = 'Mortality' AND DATE(r.created_at) = $1 THEN r.data_value ELSE 0 END), 0) as mortality
       FROM buildings b
       LEFT JOIN reports r ON b.id = r.building_id
       GROUP BY b.id, b.name, b.stock_count
       ORDER BY b.name`,
      [selectedDate]
    );

    const buildingData = result.rows.map(row => ({
      buildingId: row.id,
      buildingName: row.building_name,
      stockCount: Number(row.stock_count) || 0,
      mortality: Number(row.mortality) || 0
    }));

    res.json(buildingData);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/monthly-report - Get monthly aggregated data
dashboardRouter.get("/monthly-report", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN r.report_type = 'Egg Harvest' THEN r.data_value ELSE 0 END), 0) as eggsHarvested,
         COALESCE(SUM(CASE WHEN r.report_type = 'Feed Usage' THEN r.data_value ELSE 0 END), 0) as feedUsage,
         COALESCE(SUM(CASE WHEN r.report_type = 'Mortality' THEN r.data_value ELSE 0 END), 0) as mortality
       FROM reports r
       WHERE DATE(r.created_at) BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const monthlyData = {
      eggsHarvested: Number(result.rows[0].eggsharvested) || 0,
      feedUsage: Number(result.rows[0].feedusage) || 0,
      mortality: Number(result.rows[0].mortality) || 0
    };

    res.json(monthlyData);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/export-excel - Export monthly data as Excel file
dashboardRouter.get("/export-excel", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get monthly aggregated data
    const monthlyResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN r.report_type = 'Egg Harvest' THEN r.data_value ELSE 0 END), 0) as eggsHarvested,
         COALESCE(SUM(CASE WHEN r.report_type = 'Feed Usage' THEN r.data_value ELSE 0 END), 0) as feedUsage,
         COALESCE(SUM(CASE WHEN r.report_type = 'Mortality' THEN r.data_value ELSE 0 END), 0) as mortality
       FROM reports r
       WHERE DATE(r.created_at) BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    // Get all worker reports for the month
    const reportsResult = await pool.query(
      `SELECT 
         r.report_type,
         r.data_value,
         r.created_at,
         r.submitted_by,
         b.name as building_name
       FROM reports r
       INNER JOIN buildings b ON r.building_id = b.id
       WHERE DATE(r.created_at) BETWEEN $1 AND $2
       ORDER BY r.created_at DESC`,
      [startDate, endDate]
    );

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const monthName = new Date(startDate + 'T00:00:00').toLocaleString('default', { month: 'long' });
    const year = new Date(startDate + 'T00:00:00').getFullYear();

    // Create Summary worksheet
    const summaryData = [
      ['Monthly Report', `${monthName} ${year}`],
      [],
      ['SUMMARY'],
      ['Metric', 'Total', 'Unit'],
      ['Eggs Harvested', monthlyResult.rows[0].eggsharvested || 0, 'trays'],
      ['Feed Usage', monthlyResult.rows[0].feedusage || 0, 'bags'],
      ['Mortality', monthlyResult.rows[0].mortality || 0, 'birds']
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    wsSummary['!cols'] = [
      { wch: 20 }, // Metric column
      { wch: 15 }, // Total column  
      { wch: 10 }  // Unit column
    ];

    // Create Worker Reports worksheet
    const reportsData = [
      ['WORKER REPORTS'],
      [],
      ['Report Type', 'Data Value', 'Unit', 'Submitted By', 'Building', 'Date & Time']
    ];

    reportsResult.rows.forEach(row => {
      const reportType = row.report_type;
      const dataValue = row.data_value;
      const submittedBy = row.submitted_by;
      const buildingName = row.building_name;
      const date = new Date(row.created_at).toLocaleString();
      
      // Add unit based on report type
      let unit = '';
      if (reportType === 'Egg Harvest') unit = 'trays';
      else if (reportType === 'Feed Usage') unit = 'bags';
      else if (reportType === 'Mortality') unit = 'birds';
      
      reportsData.push([reportType, dataValue, unit, submittedBy, buildingName, date]);
    });
    
    const wsReports = XLSX.utils.aoa_to_sheet(reportsData);
    
    // Set column widths for reports sheet
    wsReports['!cols'] = [
      { wch: 15 }, // Report Type column
      { wch: 12 }, // Data Value column
      { wch: 8 },  // Unit column
      { wch: 15 }, // Submitted By column
      { wch: 15 }, // Building column
      { wch: 25 }  // Date & Time column
    ];

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsReports, 'Worker Reports');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Monthly_Report_${monthName}_${year}.xlsx"`);
    
    res.send(excelBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = { dashboardRouter };
