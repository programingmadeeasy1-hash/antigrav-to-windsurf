// ======================================================
// INVENTORY MANAGER (DYNAMIC HEADER LOOKUPS)
// ======================================================

function getInventoryList() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.PRODUCTS, getProductHeaders());
  const rows = sheet.getDataRange().getValues();
  const headers = getProductHeaders();
  const idCol = headers.indexOf("ProductID");
  const nameCol = headers.indexOf("Name");
  const catCol = headers.indexOf("Category");
  const mrpCol = headers.indexOf("MRP");
  const offerCol = headers.indexOf("OfferPrice");
  const weightCol = headers.indexOf("Weight");
  const stockCol = headers.indexOf("Stock");
  const statusCol = headers.indexOf("Status");
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    list.push({
      id: rows[i][idCol >= 0 ? idCol : 0],
      name: rows[i][nameCol >= 0 ? nameCol : 1],
      category: rows[i][catCol >= 0 ? catCol : 2],
      price: rows[i][offerCol >= 0 ? offerCol : 5] || rows[i][mrpCol >= 0 ? mrpCol : 4],
      weight: rows[i][weightCol >= 0 ? weightCol : 6],
      stock: Number(rows[i][stockCol >= 0 ? stockCol : 7]) || 0,
      status: rows[i][statusCol >= 0 ? statusCol : 19] || "ACTIVE"
    });
  }

  return list;
}

/**
 * Directly updates product stock quantity from Admin table
 */
function updateProductStock(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch(e) {}

  try {
    const sheet = getOrCreateSheet(CONFIG.SHEETS.PRODUCTS, getProductHeaders());
    const rows = sheet.getDataRange().getValues();
    const headers = getProductHeaders();
    const idCol = headers.indexOf("ProductID");
    const stockCol = headers.indexOf("Stock");
    const targetId = String(data.id);
    const newStock = Math.max(0, Number(data.newStock) || 0);

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idCol >= 0 ? idCol : 0]) === targetId) {
        sheet.getRange(i + 1, (stockCol >= 0 ? stockCol : 7) + 1).setValue(newStock);
        SpreadsheetApp.flush();
        return { success: true, id: targetId, updatedStock: newStock };
      }
    }

    throw new Error("Product ID not found in sheet.");
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}
