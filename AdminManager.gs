// ======================================================
// ADMIN MANAGER (UPDATED & CORRECTED)
// ======================================================

function getAdminHeaders() {
  return ["AdminID", "Name", "Email", "Password", "Role", "Active", "LastLogin", "Mobile", "Branch"];
}

function getAdminSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.ADMIN, getAdminHeaders(), ["Admin", "Admins", "AdminStaff", "AdminUsers"]);
}

/**
 * Handles admin login verification by Email, AdminID, or 10-digit Mobile
 */
function loginAdmin(identifier, password) {
  const sheet = getAdminSheet();
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return null;

  const headerRow = rows[0];
  const adminIdIndex = findColumnIndex(headerRow, "AdminID");
  const emailIndex = findColumnIndex(headerRow, "Email");
  const mobileIndex = findColumnIndex(headerRow, "Mobile");
  const passwordIndex = findColumnIndex(headerRow, "Password");
  const roleIndex = findColumnIndex(headerRow, "Role");
  const activeIndex = findColumnIndex(headerRow, "Active");
  const lastLoginIndex = findColumnIndex(headerRow, "LastLogin");
  const branchIndex = findColumnIndex(headerRow, "Branch");
  const nameIndex = findColumnIndex(headerRow, "Name");

  const aIdx = adminIdIndex >= 0 ? adminIdIndex : 0;
  const eIdx = emailIndex >= 0 ? emailIndex : 2;
  const mIdx = mobileIndex >= 0 ? mobileIndex : 7;
  const pIdx = passwordIndex >= 0 ? passwordIndex : 3;
  const rIdx = roleIndex >= 0 ? roleIndex : 4;
  const actIdx = activeIndex >= 0 ? activeIndex : 5;
  const lIdx = lastLoginIndex >= 0 ? lastLoginIndex : 6;
  const bIdx = branchIndex >= 0 ? branchIndex : 8;
  const nIdx = nameIndex >= 0 ? nameIndex : 1;

  const searchKey = String(identifier || "").trim().toLowerCase();
  const pwdKey = String(password || "").trim();
  const cleanSearchMobile = searchKey.replace(/\D/g, "");

  for (let i = 1; i < rows.length; i++) {
    const adminId = String(rows[i][aIdx] || "").trim().toLowerCase();
    const email = String(rows[i][eIdx] || "").trim().toLowerCase();
    const mobile = String(rows[i][mIdx] || "").replace(/\D/g, "");

    const isMatch = (email === searchKey) || 
                    (adminId === searchKey) || 
                    (cleanSearchMobile && mobile && mobile.slice(-10) === cleanSearchMobile.slice(-10));

    if (isMatch) {
      const storedPwd = String(rows[i][pIdx] || "").trim();
      if (storedPwd !== pwdKey) return null;
      
      const activeVal = String(rows[i][actIdx] || "TRUE").toUpperCase();
      if (activeVal === "FALSE" || activeVal === "SUSPENDED") {
        throw new Error("Admin account suspended or disabled.");
      }

      sheet.getRange(i + 1, lIdx + 1).setValue(new Date());
      SpreadsheetApp.flush();

      // First admin entry in sheet (row 2 / index 1) is assigned top privilege tier TIER1_MASTER
      let assignedRole = String(rows[i][rIdx] || "").trim();
      if (i === 1 || !assignedRole || assignedRole === "ADMIN") {
        assignedRole = "TIER1_MASTER";
      }

      const rowId = rows[i][aIdx] || ("ADM" + (i + 100));
      return {
        id: rowId,
        adminId: rowId,
        name: rows[i][nIdx] || "Master Owner Admin",
        email: rows[i][eIdx] || "",
        role: assignedRole,
        tier: assignedRole,
        mobile: rows[i][mIdx] || "",
        branch: rows[i][bIdx] || "Central HQ"
      };
    }
  }
  return null;
}

/**
 * Gets list of all admin staff for Master Admin directory
 */
function getAdminStaffList() {
  const sheet = getAdminSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = getAdminHeaders();
  const nameIndex = headers.indexOf("Name");
  const adminIdIndex = headers.indexOf("AdminID");
  const emailIndex = headers.indexOf("Email");
  const passwordIndex = headers.indexOf("Password");
  const roleIndex = headers.indexOf("Role");
  const activeIndex = headers.indexOf("Active");
  const lastLoginIndex = headers.indexOf("LastLogin");
  const mobileIndex = headers.indexOf("Mobile");
  const branchIndex = headers.indexOf("Branch");
  const staff = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][nameIndex >= 0 ? nameIndex : 1] && !rows[i][adminIdIndex >= 0 ? adminIdIndex : 0]) continue; // Skip blank rows
    
    const activeVal = String(rows[i][activeIndex >= 0 ? activeIndex : 5] || "TRUE").toUpperCase();
    const isActive = (activeVal === "TRUE" || activeVal === "ACTIVE");

    // Handle Date Safely
    let formattedLastLogin = "Never";
    if (rows[i][lastLoginIndex >= 0 ? lastLoginIndex : 6]) {
      const parsedDate = new Date(rows[i][lastLoginIndex >= 0 ? lastLoginIndex : 6]);
      if (!isNaN(parsedDate.getTime())) {
        formattedLastLogin = parsedDate.toLocaleString();
      }
    }

    const roleVal = String(rows[i][roleIndex >= 0 ? roleIndex : 4] || "TIER2_MANAGER");
    let tierName = "Tier 2: Operations Manager";
    if (roleVal === "TIER1_MASTER") tierName = "Tier 1: Master Owner Admin";
    if (roleVal === "TIER3_STAFF") tierName = "Tier 3: Packing & Logistics Staff";

    const rowId = String(rows[i][adminIdIndex >= 0 ? adminIdIndex : 0] || ("ADM" + (i + 100)));

    staff.push({
      id: rowId,
      adminId: rowId,
      name: String(rows[i][nameIndex >= 0 ? nameIndex : 1] || ""),
      email: String(rows[i][emailIndex >= 0 ? emailIndex : 2] || ""),
      password: String(rows[i][passwordIndex >= 0 ? passwordIndex : 3] || ""),
      role: roleVal,
      tier: roleVal,
      tierName: tierName,
      active: isActive,
      status: isActive ? "ACTIVE" : "SUSPENDED",
      lastLogin: formattedLastLogin,
      mobile: String(rows[i][mobileIndex >= 0 ? mobileIndex : 7] || ""),
      branch: String(rows[i][branchIndex >= 0 ? branchIndex : 8] || "Central Kitchen")
    });
  }

  return staff;
}

/**
 * Creates or updates an Admin Staff account with preset User ID and Password
 */
function saveAdminStaff(data) {
  const sheet = getAdminSheet();
  const rows = sheet.getDataRange().getValues();
  const targetId = String(data.adminId || data.id || "").trim();
  
  let foundRowIndex = -1;
  let existingLastLogin = "";

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === targetId.toLowerCase() && targetId !== "") {
      foundRowIndex = i + 1;
      existingLastLogin = rows[i][6] || ""; // Preserve original login date
      break;
    }
  }

  const finalAdminId = targetId || ("ADM" + Math.floor(100 + Math.random() * 900));
  const finalPassword = data.password || data.presetPassword || "admin123";
  const finalRole = data.tier || data.role || "TIER2_MANAGER";
  const finalMobile = data.mobile || "";
  const finalBranch = data.branch || "Central Unit";

  if (foundRowIndex > 0) {
    // Update existing row (Preserve existing LastLogin)
    sheet.getRange(foundRowIndex, 1, 1, 9).setValues([[
      finalAdminId,
      data.name,
      data.email || "",
      finalPassword,
      finalRole,
      "TRUE",
      existingLastLogin,
      "'" + finalMobile,
      finalBranch
    ]]);
  } else {
    // Append new admin staff row
    sheet.appendRow([
      finalAdminId,
      data.name,
      data.email || "",
      finalPassword,
      finalRole,
      "TRUE",
      "", // LastLogin blank initially
      "'" + finalMobile,
      finalBranch
    ]);
  }

  SpreadsheetApp.flush();
  return { success: true, adminId: finalAdminId };
}

/**
 * Toggles active/suspended status of an admin staff
 */
function toggleAdminStaffStatus(data) {
  const sheet = getAdminSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = getAdminHeaders();
  const idCol = headers.indexOf("AdminID");
  const activeCol = headers.indexOf("Active");
  const targetId = String((data && (data.id || data.adminId)) || data || "").trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol >= 0 ? idCol : 0] || "").trim().toLowerCase() === targetId) {
      const currentVal = String(rows[i][activeCol >= 0 ? activeCol : 5] || "TRUE").toUpperCase();
      const newVal = (currentVal === "TRUE" || currentVal === "ACTIVE") ? "FALSE" : "TRUE";
      sheet.getRange(i + 1, (activeCol >= 0 ? activeCol : 5) + 1).setValue(newVal);
      SpreadsheetApp.flush();
      return { success: true, status: newVal };
    }
  }
  return { success: false, error: "Admin staff not found." };
}

/**
 * Deletes an admin staff record from the Admin sheet
 */
function deleteAdminStaff(data) {
  const sheet = getAdminSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = getAdminHeaders();
  const idCol = headers.indexOf("AdminID");
  const targetId = String((data && (data.id || data.adminId)) || data || "").trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol >= 0 ? idCol : 0] || "").trim().toLowerCase() === targetId) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  return { success: false, error: "Admin staff not found." };
}

/**
 * Fetches accurate counts for the Admin Dashboard
 */
function getDashboardStats() {
  const stats = {
    products: 0,
    orders: 0,
    customers: 0,
    inventory: 0
  };
  
  try {
    const ss = getDatabase();
    
    // Helper to count real data rows (excluding header)
    const countRows = (sheetName) => {
      const s = ss.getSheetByName(sheetName);
      if (!s) return 0;
      const lastRow = s.getLastRow();
      return lastRow > 1 ? lastRow - 1 : 0;
    };

    stats.products = countRows(CONFIG.SHEETS.PRODUCTS);
    stats.orders = countRows(CONFIG.SHEETS.ORDERS);
    stats.customers = countRows(CONFIG.SHEETS.CUSTOMERS);
    stats.inventory = countRows(CONFIG.SHEETS.VARIANTS); // Counting variants as inventory items
    
    console.log("Stats generated:", stats);
    return stats;
  } catch (e) {
    console.error("Dashboard Stats Error: " + e.message);
    return stats; 
  }
}