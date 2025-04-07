
import { InventoryItem } from '@/types/inventory';

// Google Sheets API endpoint - This is your Google Apps Script URL
export const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwc2qV8aqUnwTMrk-gHUIwRHGkuRrs05JR8WDQJQTbJlBKr-CAxLOIx9H23BNU7Hqk38Q/exec';

export const SheetsService = {
  // Add item to Google Sheets
  async addItemToSheet(item: InventoryItem): Promise<boolean> {
    try {
      const response = await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          item: {
            id: item.id,
            codSAP: item.codSAP,
            name: item.name,
            quantity: item.quantity || 0,
            rua: item.address.rua,
            bloco: item.address.bloco,
            altura: item.address.altura,
            lado: item.address.lado,
            createdAt: item.createdAt
          }
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error adding item to sheet:', error);
      return false;
    }
  },

  // Update item in Google Sheets
  async updateItemInSheet(item: InventoryItem): Promise<boolean> {
    try {
      const response = await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          item: {
            id: item.id,
            codSAP: item.codSAP,
            name: item.name,
            quantity: item.quantity || 0,
            rua: item.address.rua,
            bloco: item.address.bloco,
            altura: item.address.altura,
            lado: item.address.lado
          }
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating item in sheet:', error);
      return false;
    }
  },

  // Move item in Google Sheets (update address)
  async moveItemInSheet(itemId: string, newAddress: { rua: string; bloco: string; altura: string; lado: 'A' | 'B' }): Promise<boolean> {
    try {
      const response = await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'move',
          itemId,
          newAddress
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error moving item in sheet:', error);
      return false;
    }
  },

  // Delete item from Google Sheets
  async deleteItemFromSheet(itemId: string): Promise<boolean> {
    try {
      const response = await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          itemId
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting item from sheet:', error);
      return false;
    }
  },

  // Fetch all items from Google Sheets (for initial loading)
  async getAllItemsFromSheet(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${SHEET_API_URL}?action=getAll`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (result.success) {
        return result.items.map((item: any) => ({
          id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          codSAP: item.codSAP,
          name: item.name,
          quantity: item.quantity || 0,
          address: {
            rua: item.rua,
            bloco: item.bloco,
            altura: item.altura,
            lado: item.lado
          },
          createdAt: item.createdAt || new Date().toISOString()
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching items from sheet:', error);
      return [];
    }
  }
};

// Este é o código Google Apps Script que deve ser usado na sua planilha Google.
// Cole este código no Google Apps Script vinculado à sua planilha.
export const googleAppsScriptCode = `
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getAll') {
    return handleGetAll();
  }
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid request method or missing action parameter'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid JSON'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  switch (data.action) {
    case 'add':
      return handleAdd(data.item);
    case 'update':
      return handleUpdate(data.item);
    case 'move':
      return handleMove(data.itemId, data.newAddress);
    case 'delete':
      return handleDelete(data.itemId);
    default:
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown action'
      })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetAll() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('enderecos');
  var data = sheet.getDataRange().getValues();
  var headers = data[1]; // Assuming headers are in row 2

  // Find column indices
  var idColIndex = headers.indexOf('ID');
  var codSAPColIndex = headers.indexOf('DEPOSITO');
  var nameColIndex = headers.indexOf('DESCRIÇÃO');
  var ruaColIndex = headers.indexOf('RUA');
  var blocoColIndex = headers.indexOf('BLOCO');
  var alturaColIndex = headers.indexOf('NIVEL');
  var ladoColIndex = headers.indexOf('LADO');
  var quantityColIndex = -1; // Optional column

  // Skip header rows (Assuming data starts from row 3)
  var items = [];
  for (var i = 2; i < data.length; i++) {
    var row = data[i];
    if (!row[ruaColIndex]) continue; // Skip empty rows

    items.push({
      id: row[idColIndex] || 'id_' + i,
      codSAP: row[codSAPColIndex] || '',
      name: row[nameColIndex] || '',
      rua: row[ruaColIndex] || '',
      bloco: row[blocoColIndex] || '',
      altura: row[alturaColIndex] || '',
      lado: row[ladoColIndex] || 'A',
      quantity: quantityColIndex >= 0 ? row[quantityColIndex] : 0,
      createdAt: new Date().toISOString()
    });
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    items: items
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleAdd(item) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('enderecos');
  var lastRow = Math.max(3, sheet.getLastRow() + 1); // Start after header rows
  
  try {
    // Find the correct columns based on headers in row 2
    var headerRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    var depositoCol = headerRow.indexOf('DEPOSITO') + 1;
    var ruaCol = headerRow.indexOf('RUA') + 1;
    var blocoCol = headerRow.indexOf('BLOCO') + 1;
    var nivelCol = headerRow.indexOf('NIVEL') + 1;
    var ladoCol = headerRow.indexOf('LADO') + 1;
    var descricaoCol = headerRow.indexOf('DESCRIÇÃO') + 1;
    var idCol = headerRow.indexOf('ID') + 1;
    
    if (ruaCol === 0 || blocoCol === 0 || nivelCol === 0 || ladoCol === 0) {
      throw new Error('Required column headers not found');
    }
    
    // Add item ID if not set
    if (!idCol || idCol === 0) {
      idCol = headerRow.length + 1;
      sheet.getRange(2, idCol).setValue('ID');
    }
    
    // Check if item already exists
    var dataRange = sheet.getRange(3, idCol, sheet.getLastRow(), 1).getValues();
    for (var i = 0; i < dataRange.length; i++) {
      if (dataRange[i][0] === item.id) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Item com este ID já existe'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Set values in the correct columns
    if (idCol > 0) sheet.getRange(lastRow, idCol).setValue(item.id);
    if (depositoCol > 0) sheet.getRange(lastRow, depositoCol).setValue(item.codSAP);
    if (ruaCol > 0) sheet.getRange(lastRow, ruaCol).setValue(item.rua);
    if (blocoCol > 0) sheet.getRange(lastRow, blocoCol).setValue(item.bloco);
    if (nivelCol > 0) sheet.getRange(lastRow, nivelCol).setValue(item.altura);
    if (ladoCol > 0) sheet.getRange(lastRow, ladoCol).setValue(item.lado);
    if (descricaoCol > 0) sheet.getRange(lastRow, descricaoCol).setValue(item.name);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Item added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleUpdate(item) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('enderecos');
  
  try {
    var headerRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idCol = headerRow.indexOf('ID') + 1;
    var depositoCol = headerRow.indexOf('DEPOSITO') + 1;
    var ruaCol = headerRow.indexOf('RUA') + 1;
    var blocoCol = headerRow.indexOf('BLOCO') + 1;
    var nivelCol = headerRow.indexOf('NIVEL') + 1;
    var ladoCol = headerRow.indexOf('LADO') + 1;
    var descricaoCol = headerRow.indexOf('DESCRIÇÃO') + 1;
    
    if (idCol === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'ID column not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find item row
    var idValues = sheet.getRange(3, idCol, sheet.getLastRow(), 1).getValues();
    var rowIndex = -1;
    
    for (var i = 0; i < idValues.length; i++) {
      if (idValues[i][0] === item.id) {
        rowIndex = i + 3; // +3 because we start checking from row 3
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Item not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update values
    if (depositoCol > 0) sheet.getRange(rowIndex, depositoCol).setValue(item.codSAP);
    if (ruaCol > 0) sheet.getRange(rowIndex, ruaCol).setValue(item.rua);
    if (blocoCol > 0) sheet.getRange(rowIndex, blocoCol).setValue(item.bloco);
    if (nivelCol > 0) sheet.getRange(rowIndex, nivelCol).setValue(item.altura);
    if (ladoCol > 0) sheet.getRange(rowIndex, ladoCol).setValue(item.lado);
    if (descricaoCol > 0) sheet.getRange(rowIndex, descricaoCol).setValue(item.name);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Item updated successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleMove(itemId, newAddress) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('enderecos');
  
  try {
    var headerRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idCol = headerRow.indexOf('ID') + 1;
    var ruaCol = headerRow.indexOf('RUA') + 1;
    var blocoCol = headerRow.indexOf('BLOCO') + 1;
    var nivelCol = headerRow.indexOf('NIVEL') + 1;
    var ladoCol = headerRow.indexOf('LADO') + 1;
    
    if (idCol === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'ID column not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find item row
    var idValues = sheet.getRange(3, idCol, sheet.getLastRow(), 1).getValues();
    var rowIndex = -1;
    
    for (var i = 0; i < idValues.length; i++) {
      if (idValues[i][0] === itemId) {
        rowIndex = i + 3; // +3 because we start checking from row 3
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Item not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update address
    if (ruaCol > 0) sheet.getRange(rowIndex, ruaCol).setValue(newAddress.rua);
    if (blocoCol > 0) sheet.getRange(rowIndex, blocoCol).setValue(newAddress.bloco);
    if (nivelCol > 0) sheet.getRange(rowIndex, nivelCol).setValue(newAddress.altura);
    if (ladoCol > 0) sheet.getRange(rowIndex, ladoCol).setValue(newAddress.lado);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Item moved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleDelete(itemId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('enderecos');
  
  try {
    var headerRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idCol = headerRow.indexOf('ID') + 1;
    
    if (idCol === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'ID column not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find item row
    var idValues = sheet.getRange(3, idCol, sheet.getLastRow(), 1).getValues();
    var rowIndex = -1;
    
    for (var i = 0; i < idValues.length; i++) {
      if (idValues[i][0] === itemId) {
        rowIndex = i + 3; // +3 because we start checking from row 3
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Item not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Clear the row instead of deleting it to maintain structure
    sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).clearContent();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Item deleted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

