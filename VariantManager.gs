// ======================================================
// VARIANT MANAGER
// ======================================================

function getVariantHeaders() {
  return ["VariantID", "ProductID", "Weight", "Price", "Stock", "Status"];
}

function getVariantSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.VARIANTS, getVariantHeaders());
}

/**
 * Gets all variants for a specific product
 */
function getVariantsByProductID(productId) {
  const sheet = getVariantSheet();
  const rows = sheet.getDataRange().getValues();
  const variants = [];

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(productId)) {
      variants.push({
        id: rows[i][0],
        productId: rows[i][1],
        weight: rows[i][2],
        price: rows[i][3],
        stock: rows[i][4],
        status: rows[i][5]
      });
    }
  }

  return variants;
}
