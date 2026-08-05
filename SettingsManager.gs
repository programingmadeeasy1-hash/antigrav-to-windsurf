// ======================================================
// SETTINGS MANAGER
// ======================================================

function getSettingsSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.SETTINGS, ["SettingKey", "SettingValue"]);
}

function getAllSettings() {
  const sheet = getSettingsSheet();
  const rows = sheet.getDataRange().getValues();
  // Default values
  const settings = {
    DELIVERY_CHARGE: 50,
    FREE_DELIVERY_LIMIT: 500,
    UPI_DISCOUNT: 0,
    UPI_ID: "q2106030721@ybl",
    MIN_ORDER_VALUE: 299,
    COD_HANDLING_FEE: 0,
    SUPPORT_WHATSAPP: "9876543210",
    ANNOUNCEMENT_BANNER: "🌾 Fresh sun-dried batches prepared weekly! Free home delivery above ₹500",
    TAX_PERCENTAGE: 0,
    MAINTENANCE_MODE: "FALSE"
  };

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      settings[String(rows[i][0])] = rows[i][1];
    }
  }
  return settings;
}

function saveSettings(settingsObject) {
  const sheet = getSettingsSheet();
  const rows = sheet.getDataRange().getValues();

  for (let key in settingsObject) {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(key)) {
        sheet.getRange(i + 1, 2).setValue(settingsObject[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, settingsObject[key]]);
    }
  }

  SpreadsheetApp.flush();
  return { success: true };
}

function getMaintenanceStatus() {
  try {
    const settings = getAllSettings();
    const isMaint = (settings.MAINTENANCE_MODE === "TRUE" || settings.MAINTENANCE_MODE === true || settings.MAINTENANCE_MODE === "true");
    return { maintenance: isMaint, maintenanceMode: isMaint };
  } catch (e) {
    return { maintenance: false, maintenanceMode: false };
  }
}

function toggleMaintenanceMode(status) {
  try {
    const isMaint = status === true || status === "true" || status === "TRUE";
    saveSettings({ MAINTENANCE_MODE: isMaint ? "TRUE" : "FALSE" });
    return { success: true, maintenance: isMaint, maintenanceMode: isMaint };
  } catch (e) {
    return { success: false, error: e.message };
  }
}