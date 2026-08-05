// ======================================================
// CATEGORY MANAGER
// ======================================================

function getCategoryHeaders() {
  return ["CategoryID", "CategoryName", "Icon", "CategoryImage", "Banner", "Priority", "Visible", "Description", "CreatedOn"];
}

function getCategorySheet() {
  return getOrCreateSheet(CONFIG.SHEETS.CATEGORIES, getCategoryHeaders());
}

function getAllCategories() {
  const sheet = getCategorySheet();
  const values = sheet.getDataRange().getValues();
  const categories = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    
    const isVisible = String(row[6]).toUpperCase() !== "FALSE";
    const catImg = String(row[3] || "https://via.placeholder.com/500");

    categories.push({
      id: String(row[0]),
      name: String(row[1] || ""),
      icon: String(row[2] || "📁"),
      imageUrl: catImg,
      banner: String(row[4] || catImg),
      priority: Number(row[5] || 99),
      visible: isVisible,
      status: isVisible ? "ACTIVE" : "INACTIVE",
      description: String(row[7] || "")
    });
  }
  return categories.sort((a, b) => a.priority - b.priority);
}

function saveCategory(data) {
  const sheet = getCategorySheet();
  const rows = sheet.getDataRange().getValues();
  const id = data.id ? String(data.id) : "";
  
  let catImage = uploadImageToGoogleDrive(data.imageUrl || data.image || "", "cat_" + Date.now());
  let bannerImg = uploadImageToGoogleDrive(data.banner || catImage, "cat_banner_" + Date.now());

  const rowData = [
    id || ("CAT" + Date.now().toString().slice(-5)),
    data.name,
    data.icon || "📁",
    catImage,
    bannerImg,
    Number(data.priority || 1),
    data.status !== "INACTIVE" ? "TRUE" : "FALSE",
    data.description || "",
    new Date()
  ];

  if (id) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === id) {
        // Update columns 1 to 8 (CreatedOn column 9 is preserved)
        sheet.getRange(i + 1, 1, 1, 8).setValues([[rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], rowData[6], rowData[7]]]);
        return { success: true, id: id };
      }
    }
  }

  sheet.appendRow(rowData);
  return { success: true, id: rowData[0] };
}

function deleteCategory(id) {
  const sheet = getCategorySheet();
  const values = sheet.getDataRange().getValues();
  const targetId = String(id && id.id ? id.id : id);

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}