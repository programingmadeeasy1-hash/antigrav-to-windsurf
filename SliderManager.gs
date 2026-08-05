// ======================================================
// HERO SLIDERS & BANNERS MANAGER
// ======================================================

function getSlidersSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.SLIDERS, [
    "SliderID", "Title", "Badge", "Subtitle", "ImageUrl", 
    "ActionType", "ActionValue", "Active", "Order", "UpdatedAt"
  ]);
}

function getAllSliders() {
  var sliders = [];

  // 1. Attempt reading from Spreadsheet
  try {
    const sheet = getSlidersSheet();
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue;
          sliders.push({
            id: String(row[0]),
            title: String(row[1] || ""),
            badge: String(row[2] || ""),
            subtitle: String(row[3] || ""),
            imageUrl: String(row[4] || ""),
            actionType: String(row[5] || "CATEGORY"),
            actionValue: String(row[6] || ""),
            active: row[7] === true || String(row[7]).toUpperCase() === "TRUE",
            order: Number(row[8]) || i,
            updatedAt: String(row[9] || "")
          });
        }
      }
    }
  } catch (e) {
    console.warn("Error reading sliders from sheet: " + e.message);
  }

  if (sliders.length > 0) return sliders;

  // 2. Fallback to ScriptProperties
  try {
    var prop = PropertiesService.getScriptProperties().getProperty("APP_HERO_SLIDERS");
    if (prop) {
      var parsed = JSON.parse(prop);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e) {}

  return getDefaultSliders();
}

function getDefaultSliders() {
  return [
    {
      id: "SLIDER101",
      title: "100% Homemade Authentic Taste",
      badge: "Special",
      subtitle: "Made with Real Ingredients • Packed with Purity",
      imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
      actionType: "CATEGORY",
      actionValue: "Mango Pickles",
      active: true,
      order: 1
    },
    {
      id: "SLIDER102",
      title: "Pre-Order Freshly Prepared Sun-Aged Batch",
      badge: "Limited Seasonal Batch #2026",
      subtitle: "Reserve your jar before the current batch sells out",
      imageUrl: "https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=800&q=80",
      actionType: "PREORDER",
      actionValue: "preorder",
      active: true,
      order: 2
    }
  ];
}

function saveSlider(slider) {
  var sliderObj = (typeof slider === 'string') ? JSON.parse(slider) : (slider || {});
  const sliderId = sliderObj.id || ("SLD" + Date.now());

  // 1. Update in-memory / ScriptProperties list
  var currentSliders = getAllSliders();
  var idx = -1;
  for (var i = 0; i < currentSliders.length; i++) {
    if (String(currentSliders[i].id) === String(sliderId)) {
      idx = i;
      break;
    }
  }

  var updatedSlider = {
    id: sliderId,
    title: sliderObj.title || "",
    badge: sliderObj.badge || "",
    subtitle: sliderObj.subtitle || "",
    imageUrl: sliderObj.imageUrl || "",
    actionType: sliderObj.actionType || "CATEGORY",
    actionValue: sliderObj.actionValue || "",
    active: sliderObj.active !== false,
    order: sliderObj.order || (currentSliders.length + 1),
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) {
    currentSliders[idx] = updatedSlider;
  } else {
    currentSliders.push(updatedSlider);
  }

  try {
    PropertiesService.getScriptProperties().setProperty("APP_HERO_SLIDERS", JSON.stringify(currentSliders));
  } catch(e) {}

  // 2. Try persisting to Sheet if available
  try {
    const sheet = getSlidersSheet();
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      const rowValues = [
        updatedSlider.id, updatedSlider.title, updatedSlider.badge, updatedSlider.subtitle, 
        updatedSlider.imageUrl, updatedSlider.actionType, updatedSlider.actionValue, 
        updatedSlider.active, updatedSlider.order, updatedSlider.updatedAt
      ];

      let foundRow = -1;
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === String(sliderId)) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, 10).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
    }
  } catch(e) {
    console.warn("Could not save slider to sheet: " + e.message);
  }

  return { success: true, id: sliderId, sliders: currentSliders };
}

function deleteSlider(id) {
  var targetId = String(id && id.id ? id.id : id);

  // Update ScriptProperties
  var currentSliders = getAllSliders();
  var filtered = currentSliders.filter(function(s) { return String(s.id) !== targetId; });
  try {
    PropertiesService.getScriptProperties().setProperty("APP_HERO_SLIDERS", JSON.stringify(filtered));
  } catch(e) {}

  // Delete from Sheet if available
  try {
    const sheet = getSlidersSheet();
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === targetId) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
  } catch(e) {}

  return { success: true, sliders: filtered };
}

function toggleSliderActive(data) {
  var targetId = String(data && data.id ? data.id : data);

  var currentSliders = getAllSliders();
  var newActive = false;
  for (var i = 0; i < currentSliders.length; i++) {
    if (String(currentSliders[i].id) === targetId) {
      currentSliders[i].active = !currentSliders[i].active;
      newActive = currentSliders[i].active;
      break;
    }
  }

  try {
    PropertiesService.getScriptProperties().setProperty("APP_HERO_SLIDERS", JSON.stringify(currentSliders));
  } catch(e) {}

  try {
    var sheet = getSlidersSheet();
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      for (var r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === targetId) {
          var cur = rows[r][7] === true || String(rows[r][7]).toUpperCase() === "TRUE";
          sheet.getRange(r + 1, 8).setValue(!cur);
          break;
        }
      }
    }
  } catch(e) {}

  return { success: true, active: newActive, sliders: currentSliders };
}
