import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { saveCSVToDevice } from './permissionManager';

/**
 * Convert entries and shop details to CSV content
 */
export const generateCSV = (entries, shopDetails, productPrices) => {
  let csv = '';

  // Header with shop details
  csv += 'SHOPIII - Data Export\n';
  csv += `Shop: ${shopDetails.name}\n`;
  csv += `Owner: ${shopDetails.owner}\n`;
  csv += `Address: ${shopDetails.address}\n`;
  csv += `Contact: ${shopDetails.contact}\n`;
  csv += `Exported: ${new Date().toLocaleString()}\n`;
  csv += '\n\n';

  // Entries Section
  csv += '=== DAILY ENTRIES ===\n';
  csv += 'Date,Item Name,Purchase Price,Sale Price,Profit,Payment Status\n';

  entries.forEach((entry) => {
    const paymentStatus = entry.isPaymentCollected ? 'Collected' : 'Pending';
    const cleanItemName = (entry.itemName || 'N/A').replace(/,/g, ';'); // Escape commas
    csv += `${entry.date},"${cleanItemName}",${entry.purchasePrice},${entry.salePrice},${entry.profit},"${paymentStatus}"\n`;
  });

  // Summary
  if (entries.length > 0) {
    const totals = entries.reduce(
      (acc, entry) => ({
        totalInvestment: acc.totalInvestment + entry.purchasePrice,
        totalSales: acc.totalSales + entry.salePrice,
        totalProfit: acc.totalProfit + entry.profit,
        pendingAmount: acc.pendingAmount + (entry.isPaymentCollected ? 0 : entry.salePrice),
        collectedAmount: acc.collectedAmount + (entry.isPaymentCollected ? entry.salePrice : 0),
      }),
      {
        totalInvestment: 0,
        totalSales: 0,
        totalProfit: 0,
        pendingAmount: 0,
        collectedAmount: 0,
      }
    );

    csv += '\n--- SUMMARY ---\n';
    csv += `Total Investment,${totals.totalInvestment}\n`;
    csv += `Total Sales,${totals.totalSales}\n`;
    csv += `Total Profit,${totals.totalProfit}\n`;
    csv += `Pending Amount,${totals.pendingAmount}\n`;
    csv += `Collected Amount,${totals.collectedAmount}\n`;
  }

  // Products Section
  if (productPrices && productPrices.length > 0) {
    csv += '\n\n=== PRODUCTS ===\n';
    csv += 'Barcode,Product Name,Purchase Price,Sale Price,Notes\n';
    productPrices.forEach((product) => {
      const cleanName = (product.productName || 'N/A').replace(/,/g, ';');
      const cleanNotes = (product.notes || '').replace(/,/g, ';');
      csv += `"${product.barcode || ''}","${cleanName}",${product.purchasePrice},${product.salePrice},"${cleanNotes}"\n`;
    });
  }

  return csv;
};

/**
 * Download CSV to device storage (primary method)
 */
export const downloadCSVToDevice = async (entries, shopDetails, productPrices) => {
  try {
    // Generate CSV content
    const csvContent = generateCSV(entries, shopDetails, productPrices);

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `shopiii_data_${timestamp}.csv`;

    // Save to device storage
    const result = await saveCSVToDevice(csvContent, filename);
    return result;
  } catch (error) {
    console.error('Error downloading CSV to device:', error);
    return {
      success: false,
      message: error.message || 'Failed to download CSV',
      error,
    };
  }
};

/**
 * Export data as CSV file and share it (alternative method)
 * Falls back to sharing if device save doesn't work
 */
export const downloadAsCSV = async (entries, shopDetails, productPrices) => {
  try {
    // Generate CSV content
    const csvContent = generateCSV(entries, shopDetails, productPrices);

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `shopiii_data_${timestamp}.csv`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;

    // Write to file
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Share CSV Export',
        UTI: 'public.comma-separated-values-text',
      });
      return { success: true, message: 'CSV exported successfully!' };
    } else {
      return {
        success: true,
        message: `CSV saved to: ${filePath}`,
        filePath,
      };
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return {
      success: false,
      message: error.message || 'Failed to export CSV',
      error,
    };
  }
};
