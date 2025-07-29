const ClientData = require('../models/ClientData');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Helper function to parse currency string to number
const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove R$, spaces, and convert comma to dot for decimal
  const cleanString = currencyString
    .toString()
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '') // Remove thousands separator
    .replace(/,/g, '.') // Convert decimal separator
    .trim();
    
  const number = parseFloat(cleanString);
  return isNaN(number) ? 0 : number;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    console.log('⚠️  Empty or null date value:', dateString);
    return null; // Return null to trigger validation error
  }
  
  // Handle different date formats
  const cleanDate = dateString.toString().trim();
  console.log('📅 Processing date:', cleanDate);
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
    // Ensure DD/MM/YYYY format
    const parts = cleanDate.split('/');
    const day = String(parts[0]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }
  
  // Handle DD-MM-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
    const parts = cleanDate.split('-');
    const day = String(parts[0]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDate)) {
    const parts = cleanDate.split('-');
    const day = String(parts[2]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[0];
    return `${day}/${month}/${year}`;
  }
  
  // Try to parse as Date object for other formats
  try {
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.log('❌ Date parsing error:', error.message);
  }
  
  console.log('❌ Could not parse date:', cleanDate);
  return null; // Return null to trigger validation error with details
};

// @desc    Upload and process CSV file from memory
// @route   POST /api/v1/client-data/upload
// @access  Private/Admin
exports.uploadCSV = async (req, res) => {
  try {
    console.log('🔑 CSV Upload Request Details:');
    console.log('   - User:', req.user ? `${req.user.name} (${req.user.role})` : 'No user found');
    console.log('   - File:', req.file ? req.file.originalname : 'No file');
    console.log('   - Headers:', Object.keys(req.headers).filter(h => h.includes('auth')));

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const fileName = req.file.originalname;
    const uploadedBy = req.user.id;
    
    console.log(`📄 Processing CSV file from memory: ${fileName} by user ${req.user.name}`);
    
    const results = [];
    const errors = [];
    let lineNumber = 0;

    // Create readable stream from buffer
    const stream = Readable.from(req.file.buffer);

    // Detect CSV separator by looking at first few lines
    const csvText = req.file.buffer.toString();
    const firstLine = csvText.split('\n')[0];
    const separatorCounts = {
      ',': (firstLine.match(/,/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length
    };
    
    // Choose separator with highest count
    const separator = Object.keys(separatorCounts).reduce((a, b) => 
      separatorCounts[a] > separatorCounts[b] ? a : b
    );
    
    console.log('🔍 CSV separator detection:');
    console.log('   - First line:', firstLine.substring(0, 100) + '...');
    console.log('   - Separator counts:', separatorCounts);
    console.log('   - Selected separator:', separator === ',' ? 'comma' : separator === ';' ? 'semicolon' : 'tab');

    // Read and parse CSV from memory with detected separator
    stream
      .pipe(csv({
        separator: separator
      }))
      .on('data', (data) => {
        lineNumber++;
        
        try {
          // Debug: Log raw CSV row data
          console.log(`📝 Row ${lineNumber} raw data:`, data);
          console.log(`📝 Available columns:`, Object.keys(data));
          
          // Skip malformed rows (rows with only auto-generated column names like _1, _2)
          const realColumns = Object.keys(data).filter(key => !key.startsWith('_'));
          if (realColumns.length === 0) {
            console.log(`⚠️ Skipping malformed row ${lineNumber} - no real columns found`);
            return;
          }
          
          // Try different possible column names for DATA field
          const dataValue = data.DATA || data.Date || data.date || data['DATA'] || 
                           Object.values(data).find(val => 
                             typeof val === 'string' && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(val)
                           );
          
          console.log(`📝 DATA field value:`, dataValue, typeof dataValue);
          
          // Flexible column mapping helper
          const getColumnValue = (columnNames) => {
            for (const name of columnNames) {
              if (data[name] !== undefined && data[name] !== '') {
                return data[name];
              }
            }
            return 0;
          };
          
          console.log(`💰 Sample column values:`);
          console.log(`   - RECEBER VP:`, getColumnValue(['RECEBER_VP', 'RECEBER VP', 'RECEBER VP']));
          console.log(`   - PAGAR VP:`, getColumnValue(['PAGAR_VP', 'PAGAR VP', 'PAGAR VP']));
          
          // Map CSV columns to our schema with flexible column matching
          const clientData = {
            DATA: formatDate(dataValue),
            RECEBER_VP: parseCurrency(getColumnValue(['RECEBER_VP', 'RECEBER VP', 'RECEBER', 'VP_RECEBER'])),
            PAGAR_VP: parseCurrency(getColumnValue(['PAGAR_VP', 'PAGAR VP', 'PAGAR', 'VP_PAGAR'])),
            RECEBER_TGN: parseCurrency(getColumnValue(['RECEBER_TGN', 'RECEBER TGN', 'TGN_RECEBER'])),
            PAGAR_TGN: parseCurrency(getColumnValue(['PAGAR_TGN', 'PAGAR TGN', 'TGN_PAGAR'])),
            TOTAL_RECEBER: parseCurrency(getColumnValue(['TOTAL_RECEBER', 'TOTAL RECEBER', 'TOTAL_REC'])),
            TOTAL_A_PAGAR: parseCurrency(getColumnValue(['TOTAL_A_PAGAR', 'TOTAL A PAGAR', 'TOTAL_PAGAR'])),
            SALDO_DIARIO: parseCurrency(getColumnValue(['SALDO_DIARIO', 'SALDO DIARIO', 'SALDO_DIA'])),
            SALDO_ACUMULADO: parseCurrency(getColumnValue(['SALDO_ACUMULADO', 'SALDO ACUMULADO', 'SALDO_ACUM'])),
            uploadedBy,
            fileName
          };
          
          // Only add records with valid dates
          if (clientData.DATA) {
            results.push(clientData);
            console.log(`✅ Row ${lineNumber} processed successfully`);
          } else {
            const errorMsg = `Invalid or missing date in row ${lineNumber}. Original date value: "${data.DATA || data.Date || data.date || 'MISSING'}"`;
            console.log(`❌ ${errorMsg}`);
            errors.push({
              line: lineNumber,
              error: errorMsg,
              originalData: data,
              availableColumns: Object.keys(data)
            });
          }
        } catch (error) {
          const errorMsg = `Error processing row ${lineNumber}: ${error.message}`;
          console.log(`❌ ${errorMsg}`);
          errors.push({
            line: lineNumber,
            error: errorMsg,
            originalData: data
          });
        }
      })
      .on('end', async () => {
        try {
          // Handle duplicate dates with upsert logic - each date should appear only once
          if (results.length > 0) {
            // First, handle duplicates within the same CSV file by grouping by date
            const groupedByDate = {};
            
            results.forEach(record => {
              const date = record.DATA;
              if (groupedByDate[date]) {
                // If date already exists, take the latest values (last occurrence wins)
                console.log(`⚠️ Duplicate date ${date} found in CSV - using latest values`);
                groupedByDate[date] = { ...record }; // Latest values win
              } else {
                groupedByDate[date] = { ...record };
              }
            });
            
            const uniqueRecords = Object.values(groupedByDate);
            console.log(`📊 Processed ${results.length} total records into ${uniqueRecords.length} unique dates`);
            
            let savedCount = 0;
            let updatedCount = 0;
            
            console.log(`🔄 Processing ${uniqueRecords.length} unique records for upsert operations...`);
            
            for (const record of uniqueRecords) {
              try {
                // Use upsert: update if date exists, insert if new
                const result = await ClientData.findOneAndUpdate(
                  { DATA: record.DATA }, // Find by date
                  {
                    $set: {
                      RECEBER_VP: record.RECEBER_VP,
                      PAGAR_VP: record.PAGAR_VP,
                      RECEBER_TGN: record.RECEBER_TGN,
                      PAGAR_TGN: record.PAGAR_TGN,
                      TOTAL_RECEBER: record.TOTAL_RECEBER,
                      TOTAL_A_PAGAR: record.TOTAL_A_PAGAR,
                      SALDO_DIARIO: record.SALDO_DIARIO,
                      SALDO_ACUMULADO: record.SALDO_ACUMULADO,
                      uploadedBy: record.uploadedBy,
                      fileName: record.fileName,
                      uploadDate: new Date()
                    }
                  },
                  { 
                    upsert: true, // Create if doesn't exist
                    new: true,    // Return updated document
                    runValidators: true
                  }
                );
                
                // Check if it was an update or insert
                if (result.isNew === false) {
                  updatedCount++;
                  console.log(`📝 Updated existing record for date: ${record.DATA}`);
                } else {
                  savedCount++;
                  console.log(`✨ Created new record for date: ${record.DATA}`);
                }
              } catch (recordError) {
                console.error(`❌ Error processing record for date ${record.DATA}:`, recordError.message);
                errors.push({
                  date: record.DATA,
                  error: recordError.message,
                  data: record
                });
              }
            }
            
            console.log(`✅ Database operations completed:`);
            console.log(`   - New records: ${savedCount}`);
            console.log(`   - Updated records: ${updatedCount}`);
            console.log(`   - Total unique dates: ${savedCount + updatedCount}`);
          }
          
          res.status(200).json({
            status: 'success',
            message: `CSV file processed successfully. ${results.length} records processed${errors.length > 0 ? `, ${errors.length} rows had errors` : ''}`,
            data: {
              totalRecords: results.length,
              savedRecords: results.length,
              skippedRecords: errors.length,
              fileName: fileName,
              uploadedBy,
              uploadedAt: new Date().toISOString(),
              errors: errors.length > 0 ? errors.slice(0, 5) : [], // Show first 5 errors max
              message: "Each date appears only once - duplicates were updated with latest values"
            }
          });
        } catch (error) {
          console.error('❌ Error saving to database:', error);
          
          res.status(500).json({
            status: 'error',
            message: 'Error saving data to database',
            error: error.message
          });
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV from memory:', error);
        
        res.status(500).json({
          status: 'error',
          message: 'Error reading CSV file',
          error: error.message
        });
      });

  } catch (error) {
    console.error('❌ CSV upload error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error processing CSV file',
      error: error.message
    });
  }
};

// @desc    Get all client data
// @route   GET /api/v1/client-data
// @access  Private
exports.getClientData = async (req, res) => {
  try {
    console.log('🔍 === GET CLIENT DATA REQUEST ===');
    console.log('👤 User:', req.user ? `${req.user.name} (${req.user.role})` : 'No user');
    console.log('📝 Query params:', req.query);
    
    const { page = 1, limit = 100, startDate, endDate } = req.query;
    
    let query = {};
    
    // Date range filter
    if (startDate && endDate) {
      query.uploadDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    console.log('🔎 Database query:', query);
    
    // Check total count first
    const totalCount = await ClientData.countDocuments(query);
    console.log('📊 Total records in database:', totalCount);
    
    if (totalCount === 0) {
      console.log('⚠️ No data found in ClientData collection');
      console.log('💡 Tip: Upload CSV data through System Analytics page first');
    }
    
    // Use aggregation pipeline for proper date sorting (DD/MM/YYYY format)
    const clientData = await ClientData.aggregate([
      { $match: query },
      {
        $addFields: {
          // Convert DD/MM/YYYY string to proper date for sorting
          dateForSorting: {
            $dateFromString: {
              dateString: {
                $concat: [
                  { $substr: ["$DATA", 6, 4] }, "-", // year
                  { $substr: ["$DATA", 3, 2] }, "-", // month  
                  { $substr: ["$DATA", 0, 2] }       // day
                ]
              },
              onError: new Date(0) // fallback for invalid dates
            }
          }
        }
      },
      { $sort: { dateForSorting: 1 } }, // Sort chronologically
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 },
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploadedBy',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      {
        $addFields: {
          uploadedBy: { $arrayElemAt: ['$uploadedBy', 0] }
        }
      },
      { $project: { dateForSorting: 0 } } // Remove temporary field
    ]);
    
    console.log('📤 Returning data:');
    console.log('   - Records found:', clientData.length);
    console.log('   - Sample record:', clientData[0] ? {
      DATA: clientData[0].DATA,
      TOTAL_RECEBER: clientData[0].TOTAL_RECEBER,
      TOTAL_A_PAGAR: clientData[0].TOTAL_A_PAGAR,
      fileName: clientData[0].fileName
    } : 'No records');
    
    const total = await ClientData.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        clientData,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('❌ Get client data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching client data'
    });
  }
};

// @desc    Delete client data by ID
// @route   DELETE /api/v1/client-data/:id
// @access  Private/Admin
exports.deleteClientData = async (req, res) => {
  try {
    const clientData = await ClientData.findById(req.params.id);
    
    if (!clientData) {
      return res.status(404).json({
        status: 'error',
        message: 'Client data not found'
      });
    }
    
    await ClientData.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Client data deleted: ${req.params.id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Client data deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete client data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting client data'
    });
  }
};

// @desc    Get analytics data for charts
// @route   GET /api/v1/client-data/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    // Get data for the last specified days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const analyticsData = await ClientData.aggregate([
      {
        $match: {
          uploadDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$DATA',
          totalReceber: { $sum: '$TOTAL_RECEBER' },
          totalPagar: { $sum: '$TOTAL_A_PAGAR' },
          saldoDiario: { $sum: '$SALDO_DIARIO' },
          saldoAcumulado: { $last: '$SALDO_ACUMULADO' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: analyticsData
    });
  } catch (error) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching analytics data'
    });
  }
};

// @desc    Clean up duplicate dates - keep only the most recent record for each date
// @route   POST /api/v1/client-data/cleanup-duplicates
// @access  Private/Admin
exports.cleanupDuplicates = async (req, res) => {
  try {
    console.log('🧹 === STARTING DUPLICATE CLEANUP ===');
    
    // Find all duplicate dates
    const duplicates = await ClientData.aggregate([
      {
        $group: {
          _id: '$DATA',
          count: { $sum: 1 },
          records: { $push: { id: '$_id', uploadDate: '$uploadDate' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    console.log(`🔍 Found ${duplicates.length} dates with duplicates`);
    
    let totalRemoved = 0;
    
    for (const duplicate of duplicates) {
      const date = duplicate._id;
      const records = duplicate.records;
      
      // Sort by uploadDate (most recent first) and keep the first one
      records.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      const toKeep = records[0];
      const toRemove = records.slice(1);
      
      console.log(`📅 Date ${date}: keeping ${toKeep.id}, removing ${toRemove.length} duplicates`);
      
      // Remove all but the most recent
      for (const record of toRemove) {
        await ClientData.findByIdAndDelete(record.id);
        totalRemoved++;
      }
    }
    
    console.log(`✅ Cleanup completed: removed ${totalRemoved} duplicate records`);
    console.log(`🎯 Each date now appears only once!`);
    
    res.status(200).json({
      status: 'success',
      message: `Successfully cleaned up duplicates. Removed ${totalRemoved} duplicate records from ${duplicates.length} dates.`,
      data: {
        duplicatesFound: duplicates.length,
        recordsRemoved: totalRemoved,
        message: "Each date now appears only once in the database"
      }
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error cleaning up duplicates',
      error: error.message
    });
  }
}; 