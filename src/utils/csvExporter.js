import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { saveCSVToDevice } from './permissionManager';

const xmlEscape = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const toRow = (cells) => {
  const cellXml = cells
    .map((cell) => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`)
    .join('');
  return `<Row>${cellXml}</Row>`;
};

/**
 * Build an Excel 2003 XML workbook content (.xls-compatible).
 * This format opens directly in Microsoft Excel on mobile and desktop.
 */
export const generateCSV = (entries, shopDetails, productPrices) => {
  const rows = [];
  rows.push(toRow(['SHOPIII - Data Export']));
  rows.push(toRow([`Shop: ${shopDetails?.name || ''}`]));
  rows.push(toRow([`Owner: ${shopDetails?.owner || ''}`]));
  rows.push(toRow([`Address: ${shopDetails?.address || ''}`]));
  rows.push(toRow([`Contact: ${shopDetails?.contact || ''}`]));
  rows.push(toRow([`Exported: ${new Date().toLocaleString()}`]));
  rows.push(toRow(['']));
  rows.push(toRow(['DAILY TOTALS']));
  rows.push(toRow(['Date', 'Total Purchases', 'Total Sales', 'Profit']));

  (entries || []).forEach((entry) => {
    rows.push(
      toRow([
        entry?.date || '',
        String(entry?.purchasePrice || 0),
        String(entry?.salePrice || 0),
        String(entry?.profit || 0),
      ])
    );
  });

  if (entries.length > 0) {
    const totals = entries.reduce(
      (acc, entry) => ({
        totalInvestment: acc.totalInvestment + (entry.purchasePrice || 0),
        totalSales: acc.totalSales + (entry.salePrice || 0),
        totalProfit: acc.totalProfit + (entry.profit || 0),
      }),
      {
        totalInvestment: 0,
        totalSales: 0,
        totalProfit: 0,
      }
    );

    rows.push(toRow(['']));
    rows.push(toRow(['SUMMARY']));
    rows.push(toRow(['Total Investment', String(totals.totalInvestment)]));
    rows.push(toRow(['Total Sales', String(totals.totalSales)]));
    rows.push(toRow(['Total Profit', String(totals.totalProfit)]));
  }

  if (productPrices && productPrices.length > 0) {
    rows.push(toRow(['']));
    rows.push(toRow(['PRODUCTS']));
    rows.push(toRow(['Barcode', 'Product Name', 'Purchase Price', 'Sale Price', 'Notes']));
    productPrices.forEach((product) => {
      rows.push(
        toRow([
          product?.barcode || '',
          product?.productName || 'N/A',
          String(product?.purchasePrice || 0),
          String(product?.salePrice || 0),
          product?.notes || '',
        ])
      );
    });
  }

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Shopiii Export">
    <Table>
      ${rows.join('')}
    </Table>
  </Worksheet>
</Workbook>`;
};

/**
 * Download Excel file (.xls) to device storage (primary method)
 */
export const downloadCSVToDevice = async (entries, shopDetails, productPrices) => {
  try {
    const excelContent = generateCSV(entries, shopDetails, productPrices);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `shopiii_data_${timestamp}.xls`;

    const result = await saveCSVToDevice(excelContent, filename);
    return result;
  } catch (error) {
    console.error('Error downloading Excel to device:', error);
    return {
      success: false,
      message: error.message || 'Failed to download Excel file',
      error,
    };
  }
};

/**
 * Export data as an Excel file and share it (alternative method)
 */
export const downloadAsCSV = async (entries, shopDetails, productPrices) => {
  try {
    const excelContent = generateCSV(entries, shopDetails, productPrices);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `shopiii_data_${timestamp}.xls`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, excelContent, {
      encoding: 'utf8',
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.ms-excel',
        dialogTitle: 'Share Excel Export',
        UTI: 'com.microsoft.excel.xls',
      });
      return { success: true, message: 'Excel file exported successfully!' };
    } else {
      return {
        success: true,
        message: `Excel file saved to: ${filePath}`,
        filePath,
      };
    }
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return {
      success: false,
      message: error.message || 'Failed to export Excel file',
      error,
    };
  }
};
