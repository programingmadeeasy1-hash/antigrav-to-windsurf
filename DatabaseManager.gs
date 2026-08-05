// ======================================================
// DATABASE MANAGER
// ======================================================

function getDatabase() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      return active;
    }
  } catch (e) {
    console.warn("No active spreadsheet available:", e.message);
  }

  try {
    if (typeof CONFIG !== "undefined" && CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" && CONFIG.SPREADSHEET_ID.length > 10) {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
  } catch (e) {
    console.warn("Failed to open spreadsheet by ID: " + e.message);
  }

  return null;
}

function normalizeHeaderName(value) {
  return String(value || "").trim().toLowerCase();
}

function ensureSheetHeaders(sheet, headers) {
  if (!sheet) return sheet;

  const requiredHeaders = Array.isArray(headers) ? headers : [];
  if (!requiredHeaders.length) return sheet;

  const currentColumnCount = Math.max(sheet.getLastColumn(), requiredHeaders.length);
  const headerRow = sheet.getRange(1, 1, 1, currentColumnCount).getValues()[0] || [];
  const existingHeaders = headerRow.map(value => String(value || "").trim());

  if (!existingHeaders.some(value => value)) {
    sheet.getRange(1, 1, 1, requiredHeaders.length)
      .setValues([requiredHeaders])
      .setFontWeight("bold")
      .setBackground("#E2EFDA");
    sheet.setFrozenRows(1);
    return sheet;
  }

  const missingHeaders = requiredHeaders.filter(header => !existingHeaders.some(existing => normalizeHeaderName(existing) === normalizeHeaderName(header)));
  if (missingHeaders.length > 0) {
    const startCol = sheet.getLastColumn() + 1;
    sheet.insertColumnsAfter(sheet.getLastColumn() || 1, missingHeaders.length);
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.getRange(1, startCol, 1, missingHeaders.length).setFontWeight("bold").setBackground("#F8FAFC");
  }

  return sheet;
}

function getOrCreateSheet(name, headers, fallbackNames) {
  try {
    const ss = getDatabase();
    if (!ss) return null;
    const candidates = [name].concat(Array.isArray(fallbackNames) ? fallbackNames : []);
    const seen = new Set();

    for (const candidate of candidates) {
      if (!candidate) continue;
      const normalized = String(candidate).trim().toLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);

      const existing = ss.getSheetByName(candidate);
      if (existing) {
        ensureSheetHeaders(existing, headers);
        return existing;
      }
    }

    const sheet = ss.insertSheet(name);
    ensureSheetHeaders(sheet, headers);
    return sheet;
  } catch(e) {
    console.warn("getOrCreateSheet error for " + name + ": " + e.message);
    return null;
  }
}

/**
 * Initializes all required sheets. Run this via doGet(?setup=true) or manually.
 */
function setupDatabase() {
  // Define all sheets and their headers
  const setupPlan = [
    { name: CONFIG.SHEETS.ADMIN, headers: ["AdminID", "Name", "Email", "Password", "Role", "Active", "LastLogin", "Mobile", "Branch"] },
    { name: CONFIG.SHEETS.CATEGORIES, headers: ["CategoryID", "CategoryName", "Icon", "CategoryImage", "Banner", "Priority", "Visible", "Description", "CreatedOn"] },
    { name: CONFIG.SHEETS.PRODUCTS, headers: ["ProductID", "Name", "Category", "SubCategory", "MRP", "OfferPrice", "Weight", "Stock", "Featured", "Offer", "BestSeller", "NewArrival", "PreOrder", "BulkAvailable", "BatchStatus", "Image1", "Image2", "Image3", "Description", "Status"] },
    { name: CONFIG.SHEETS.VARIANTS, headers: ["VariantID", "ProductID", "Weight", "Price", "Stock", "Status"] },
    { name: CONFIG.SHEETS.ORDERS, headers: ["OrderID", "CustomerID", "CustomerName", "Mobile", "Address", "Items", "Subtotal", "Delivery", "Discount", "GrandTotal", "PaymentMode", "PaymentStatus", "OrderStatus", "CreatedOn"] },
    { name: CONFIG.SHEETS.CUSTOMERS, headers: ["CustomerID", "Name", "Mobile", "Password", "Email", "House", "Street", "Area", "Landmark", "City", "State", "PIN", "Latitude", "Longitude", "RegisteredOn", "LastLogin", "LastOrder", "TotalOrders", "LifetimeValue", "Status"] },
    { name: CONFIG.SHEETS.SETTINGS, headers: ["SettingKey", "SettingValue"] },
    { name: CONFIG.SHEETS.SLIDERS, headers: ["SliderID", "Title", "Badge", "Subtitle", "ImageUrl", "ActionType", "ActionValue", "Active", "Order", "UpdatedAt"] },
    { name: CONFIG.SHEETS.COUPONS, headers: ["CouponID", "Code", "DiscountType", "DiscountValue", "MinOrder", "Active", "ExpiryDate", "MaxUses", "UsedCount", "MaxUsesPerCustomer", "AllowedCustomers", "UsageLog"] },
    { name: CONFIG.SHEETS.AUTO_COUPON_RULES, headers: ["RuleID", "RuleName", "Active", "MinOrders", "MinSpend", "MinDaysRegistered", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "CreatedOn", "LastUpdated"] },
    { name: CONFIG.SHEETS.AUTO_COUPON_APPROVALS, headers: ["RequestID", "RuleID", "CustomerID", "CustomerName", "Mobile", "Reason", "Status", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "Active", "RequestedOn", "ApprovedOn"] },
    { name: CONFIG.SHEETS.INVENTORY, headers: ["LogID", "ProductID", "VariantID", "ChangeType", "Quantity", "NewStock", "Notes", "Timestamp"] }
  ];

  setupPlan.forEach(item => getOrCreateSheet(item.name, item.headers));

  // Handle Yearly Sheets
  const currentYear = new Date().getFullYear();
  const yearlyHeaders = ["BatchID", "BatchNumber", "ProductName", "BatchName", "Tag", "TotalStock", "BookedCount", "DeliveryEstimate", "Status", "ImageUrl", "CreatedAt"];
  const specialOrderHeaders = ["OrderID", "Type", "BatchID", "BatchNumber", "ProductName", "CustomerName", "Mobile", "Quantity", "Unit", "Status", "Notes", "CreatedOn"];
  
  getOrCreateSheet(CONFIG.SHEETS.BATCHES, yearlyHeaders);
  getOrCreateYearSheet(CONFIG.SHEETS.BATCHES, currentYear, yearlyHeaders);
  
  getOrCreateSheet(CONFIG.SHEETS.SPECIAL_ORDERS, specialOrderHeaders);
  getOrCreateYearSheet(CONFIG.SHEETS.SPECIAL_ORDERS, currentYear, specialOrderHeaders);

  setupYearlyArchiveIndex();

  // Seed default Settings if empty
  try {
    if (typeof getAllSettings === "function" && typeof saveSettings === "function") {
      saveSettings(getAllSettings());
    }
  } catch(e) {
    console.warn("Settings seed warning: " + e.message);
  }
  
  return { success: true, message: "Database Setup Complete. All sheets initialized." };
}

function getOrCreateYearSheet(baseName, year, headers) {
  const yearSheetName = baseName + "_" + (year || new Date().getFullYear());
  return getOrCreateSheet(yearSheetName, headers);
}

function setupYearlyArchiveIndex() {
  const sheet = getOrCreateSheet("Years_Archive_Index", ["Year", "Sequence Status", "PreOrder Batches Sheet", "Special Orders Sheet", "Orders Sheet", "Notes"]);
  const currentYear = new Date().getFullYear();
  const rows = sheet.getDataRange().getValues();
  
  if (rows.length <= 1) {
    const yearData = [];
    for (let y = 2024; y <= 2030; y++) {
      const status = (y === currentYear) ? "🟢 ACTIVE" : (y < currentYear) ? "📁 ARCHIVE" : "⏳ UPCOMING";
      yearData.push([y, status, "PreOrderBatches_"+y, "SpecialOrders_"+y, "Orders_"+y, "Auto-generated index"]);
    }
    sheet.getRange(2, 1, yearData.length, yearData[0].length).setValues(yearData);
  }
}

function uploadImageToGoogleDrive(base64Data, filename) {
  try {
    if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;

    const parts = base64Data.split(",");
    const mimeType = parts[0].match(/:(.*?);/)[1];
    const bytes = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(bytes, mimeType, filename || "img_" + Date.now());
    
    let folder;
    const folderName = "AaharShree_Store_Images";
    const folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // Try to set public permissions
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn("Could not set folder to public. Images might not display for everyone.");
    }
    
    const file = folder.createFile(blob);
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  } catch (err) {
    console.error("Image Upload Error: " + err.message);
    return base64Data;
  }
}