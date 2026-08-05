// ======================================================
// SPECIAL ORDER & PRE-ORDER BATCH MANAGER
// ======================================================

function getBatchHeaders() {
  return [
    "BatchID", "BatchNumber", "ProductName", "BatchName", "Tag",
    "TotalStock", "BookedCount", "DeliveryEstimate", "Status",
    "ImageUrl", "CreatedAt"
  ];
}

function getBatchSheet(targetYear) {
  var yr = targetYear || new Date().getFullYear();
  try {
    if (typeof CONFIG !== "undefined" && CONFIG.SHEETS && CONFIG.SHEETS.BATCHES) {
      if (typeof getOrCreateYearSheet === "function") {
        return getOrCreateYearSheet(CONFIG.SHEETS.BATCHES, yr, getBatchHeaders());
      }
      return getOrCreateSheet(CONFIG.SHEETS.BATCHES, getBatchHeaders());
    }
  } catch(e) {
    console.warn("getBatchSheet error: " + e.message);
  }
  return null;
}

/**
 * Generate sequential batch number (e.g. BATCH-2026-001, BATCH-2027-001)
 */
function getNextBatchNumber(targetYear) {
  var year = targetYear || new Date().getFullYear();
  var prefix = "BATCH-" + year + "-";
  var batches = getPreOrderBatches(year);
  var maxNum = 0;

  for (var i = 0; i < batches.length; i++) {
    var bNo = String(batches[i].batchNumber || "");
    if (bNo.indexOf(prefix) === 0) {
      var numPart = parseInt(bNo.substring(prefix.length)) || 0;
      if (numPart > maxNum) maxNum = numPart;
    }
  }
  var nextNum = maxNum + 1;
  var formattedNum = (nextNum < 100 ? (nextNum < 10 ? "00" : "0") : "") + nextNum;
  return prefix + formattedNum;
}

/**
 * Fetch all Pre-Order Batches from Spreadsheet or ScriptProperties for a specific year
 */
function getPreOrderBatches(targetYear) {
  var yr = targetYear || new Date().getFullYear();
  var yrStr = String(yr);

  // 1. Try reading from Spreadsheet Sheet
  try {
    var sheet = getBatchSheet(yr);
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      if (rows.length > 1) {
        var result = [];
        for (var i = 1; i < rows.length; i++) {
          if (!rows[i][0]) continue;
          result.push({
            id: String(rows[i][0]),
            batchNumber: String(rows[i][1] || ("BATCH-" + yr + "-" + (i < 10 ? "00" + i : "0" + i))),
            productName: String(rows[i][2] || ""),
            batchName: String(rows[i][3] || ""),
            tag: String(rows[i][4] || "Pre-Order"),
            totalStock: Number(rows[i][5]) || 0,
            bookedCount: Number(rows[i][6]) || 0,
            deliveryEstimate: String(rows[i][7] || ""),
            status: String(rows[i][8] || "ACTIVE"),
            imageUrl: String(rows[i][9] || ""),
            createdAt: String(rows[i][10] || new Date().toISOString())
          });
        }
        if (result.length > 0) return result;
      }
    }
  } catch(e) {
    console.warn("Error reading pre-order batches sheet: " + e.message);
  }

  // 2. Try ScriptProperties
  try {
    var prop = PropertiesService.getScriptProperties().getProperty("APP_PREORDER_BATCHES");
    if (prop) {
      var allBatches = JSON.parse(prop);
      if (Array.isArray(allBatches) && allBatches.length > 0) {
        var filtered = allBatches.filter(function(b) {
          if (!b) return false;
          var bNoYr = b.batchNumber ? String(b.batchNumber).split("-")[1] : null;
          var cYr = b.createdAt ? String(new Date(b.createdAt).getFullYear()) : null;
          return bNoYr === yrStr || cYr === yrStr || !targetYear;
        });
        return filtered.length > 0 ? filtered : allBatches;
      }
    }
  } catch(e) {}

  // 3. Fallback to default batches
  return getDefaultPreOrderBatches();
}

function getDefaultPreOrderBatches() {
  return [
    {
      id: "BATCH101",
      batchNumber: "BATCH-2026-001",
      productName: "Special Punjabi Mango Pickle (Aam Ka Achar)",
      batchName: "Sun-Dried Batch #2026-M1",
      tag: "Pre-Order",
      totalStock: 50,
      bookedCount: 18,
      status: "ACTIVE",
      deliveryEstimate: "Ships by Aug 5, 2026",
      imageUrl: "https://images.unsplash.com/photo-1599909631369-02eb644910e5?w=500",
      createdAt: "2026-07-25T10:00:00.000Z"
    },
    {
      id: "BATCH102",
      batchNumber: "BATCH-2026-002",
      productName: "Banarasi Stuffed Red Chilli Pickle",
      batchName: "Authentic Banarasi Batch #2026-R1",
      tag: "Fresh Harvest",
      totalStock: 30,
      bookedCount: 28,
      status: "ACTIVE",
      deliveryEstimate: "Ships by Aug 12, 2026",
      imageUrl: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=500",
      createdAt: "2026-07-26T12:00:00.000Z"
    },
    {
      id: "BATCH103",
      batchNumber: "BATCH-2026-003",
      productName: "Khatta Meetha Lemon Pickle",
      batchName: "Oil-Free Sun-Aged Batch #2026-L1",
      tag: "Limited Batch",
      totalStock: 25,
      bookedCount: 25,
      status: "CLOSED",
      deliveryEstimate: "Batch Fully Booked",
      imageUrl: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=500",
      createdAt: "2026-07-27T08:00:00.000Z"
    }
  ];
}

/**
 * Save or Update a Pre-Order Batch (Year Aware)
 */
function savePreOrderBatch(batchInput, year) {
  var batch = (typeof batchInput === 'string') ? JSON.parse(batchInput) : (batchInput || {});
  var batchYear = year;
  if (!batchYear && batch && batch.batchNumber) {
    var parts = String(batch.batchNumber).split("-");
    if (parts.length >= 2 && parseInt(parts[1]) > 2000) {
      batchYear = parseInt(parts[1]);
    }
  }
  if (!batchYear) batchYear = new Date().getFullYear();

  var batches = getPreOrderBatches(batchYear);
  if (!batch.batchNumber || String(batch.batchNumber).trim() === "") {
    batch.batchNumber = getNextBatchNumber(batchYear);
  }
  if (!batch.createdAt) {
    batch.createdAt = new Date().toISOString();
  }
  
  batch.totalStock = parseInt(batch.totalStock) || 0;
  batch.bookedCount = parseInt(batch.bookedCount) || 0;
  batch.tag = batch.tag || "Pre-Order";

  // Automatic calculation & status update
  if (batch.bookedCount >= batch.totalStock && batch.totalStock > 0) {
    batch.status = "CLOSED";
  } else if (!batch.status) {
    batch.status = "ACTIVE";
  }

  var isExisting = batch.id && String(batch.id).trim() !== "" && String(batch.id) !== "undefined";

  if (isExisting) {
    var idx = -1;
    for (var i = 0; i < batches.length; i++) {
      if (String(batches[i].id) === String(batch.id)) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      batches[idx] = batch;
    } else {
      batches.push(batch);
    }
  } else {
    batch.id = "BATCH" + Math.floor(1000 + Math.random() * 9000);
    batches.push(batch);
  }

  // Save to ScriptProperties backup ALWAYS
  try {
    PropertiesService.getScriptProperties().setProperty("APP_PREORDER_BATCHES_" + batchYear, JSON.stringify(batches));
    PropertiesService.getScriptProperties().setProperty("APP_PREORDER_BATCHES", JSON.stringify(batches));
  } catch(e) {}

  // Save to Google Spreadsheet Year Sheet if available
  try {
    var sheet = getBatchSheet(batchYear);
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === String(batch.id)) {
          foundRow = r + 1;
          break;
        }
      }
      var rowData = [
        batch.id, batch.batchNumber, batch.productName, batch.batchName,
        batch.tag, batch.totalStock, batch.bookedCount, batch.deliveryEstimate || "",
        batch.status, batch.imageUrl || "", batch.createdAt
      ];

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      SpreadsheetApp.flush();
    }
  } catch(e) {
    console.warn("Could not save batch to sheet: " + e.message);
  }

  return { success: true, batch: batch, batches: batches };
}

function getSpecialOrders(targetYear) {
  var orders = [];

  // Try Spreadsheet
  try {
    if (typeof CONFIG !== "undefined" && CONFIG.SHEETS && CONFIG.SHEETS.SPECIAL_ORDERS) {
      var sheet = getOrCreateSheet(CONFIG.SHEETS.SPECIAL_ORDERS, ["OrderID", "Type", "BatchID", "BatchNumber", "ProductName", "CustomerName", "Mobile", "Quantity", "Unit", "Status", "Notes", "CreatedOn"]);
      if (sheet) {
        var rows = sheet.getDataRange().getValues();
        if (rows.length > 1) {
          for (var i = 1; i < rows.length; i++) {
            if (!rows[i][0]) continue;
            orders.push({
              id: String(rows[i][0]),
              type: String(rows[i][1] || "PREORDER"),
              batchId: String(rows[i][2] || ""),
              batchNumber: String(rows[i][3] || ""),
              productName: String(rows[i][4] || ""),
              customerName: String(rows[i][5] || ""),
              mobile: String(rows[i][6] || ""),
              quantity: Number(rows[i][7]) || 1,
              unit: String(rows[i][8] || "Jars"),
              status: String(rows[i][9] || "PENDING"),
              notes: String(rows[i][10] || ""),
              createdAt: String(rows[i][11] || new Date().toISOString())
            });
          }
        }
      }
    }
  } catch(e) {}

  if (orders.length > 0) return orders;

  // Try ScriptProperties
  try {
    var prop = PropertiesService.getScriptProperties().getProperty("APP_SPECIAL_ORDERS");
    if (prop) {
      orders = JSON.parse(prop);
      if (Array.isArray(orders) && orders.length > 0) return orders;
    }
  } catch(e) {}

  // Defaults
  orders = [
    {
      id: "PREORD-1001",
      type: "PREORDER",
      batchId: "BATCH101",
      batchNumber: "BATCH-2026-001",
      productName: "Special Punjabi Mango Pickle (Aam Ka Achar)",
      customerName: "Rahul Sharma",
      mobile: "9876543210",
      quantity: 2,
      unit: "Jars (1 kg each)",
      status: "CONFIRMED",
      createdAt: "2026-07-25T10:30:00.000Z",
      notes: "Pre-booked for August batch dispatch"
    },
    {
      id: "BULKORD-1002",
      type: "BULK",
      customerName: "Priya Verma",
      mobile: "9811223344",
      eventName: "Wedding Return Gifts",
      requirement: "15 kg Mango + 10 kg Lemon Jars",
      quantity: 25,
      status: "PENDING",
      createdAt: "2026-07-26T14:15:00.000Z",
      notes: "Requested custom jar ribbon packaging"
    }
  ];

  return orders;
}

/**
 * Creates Pre-Order and automatically updates batch bookedCount
 */
function createPreOrder(orderData) {
  var data = (typeof orderData === 'string') ? JSON.parse(orderData) : (orderData || {});
  var batches = getPreOrderBatches();
  var targetBatch = null;
  for (var i = 0; i < batches.length; i++) {
    if (String(batches[i].id) === String(data.batchId) || 
        String(batches[i].batchNumber) === String(data.batchNumber) || 
        batches[i].productName === data.productName) {
      targetBatch = batches[i];
      break;
    }
  }

  if (!targetBatch) {
    return { success: false, error: "Pre-order batch not found." };
  }

  var qtyNeeded = parseInt(data.quantity) || 1;
  var remaining = targetBatch.totalStock - targetBatch.bookedCount;

  if (remaining <= 0 || targetBatch.status !== "ACTIVE") {
    return { success: false, error: "Sorry, this pre-order batch is fully booked and sold out!" };
  }

  if (qtyNeeded > remaining) {
    return { success: false, error: "Only " + remaining + " jar(s) left in this pre-order batch." };
  }

  // Automatic calculation & booking update
  targetBatch.bookedCount += qtyNeeded;
  if (targetBatch.bookedCount >= targetBatch.totalStock) {
    targetBatch.status = "CLOSED";
  }
  
  // Save updated batch
  savePreOrderBatch(targetBatch);

  // Save Special Order
  var orders = getSpecialOrders();
  var newOrder = {
    id: "PREORD-" + Math.floor(1000 + Math.random() * 9000),
    type: "PREORDER",
    batchId: targetBatch.id,
    batchNumber: targetBatch.batchNumber,
    productName: targetBatch.productName,
    customerId: data.customerId || data.customerID || "",
    customerID: data.customerID || data.customerId || "",
    customerName: data.customerName || "Customer",
    mobile: data.mobile || "",
    quantity: qtyNeeded,
    unit: data.unit || "Jars",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    notes: data.notes || ""
  };
  orders.unshift(newOrder);
  
  try {
    PropertiesService.getScriptProperties().setProperty("APP_SPECIAL_ORDERS", JSON.stringify(orders));
  } catch(e) {}

  return { success: true, order: newOrder, remainingStock: targetBatch.totalStock - targetBatch.bookedCount };
}

function createBulkOrder(orderData) {
  var data = (typeof orderData === 'string') ? JSON.parse(orderData) : (orderData || {});
  var orders = getSpecialOrders();
  var newOrder = {
    id: "BULKORD-" + Math.floor(1000 + Math.random() * 9000),
    type: "BULK",
    customerId: data.customerId || data.customerID || "",
    customerID: data.customerID || data.customerId || "",
    customerName: data.customerName || "Customer",
    mobile: data.mobile || "",
    eventName: data.eventName || "Bulk Booking",
    requirement: data.requirement || "Wholesale Order",
    quantity: data.quantity || 1,
    items: data.items || [],
    status: "PENDING",
    createdAt: new Date().toISOString(),
    notes: data.notes || data.customNote || ""
  };
  orders.unshift(newOrder);
  try {
    PropertiesService.getScriptProperties().setProperty("APP_SPECIAL_ORDERS", JSON.stringify(orders));
  } catch(e) {}

  return { success: true, order: newOrder };
}

function updateSpecialOrderStatus(data, statusParam) {
  var targetId = (typeof data === 'object' && data !== null && data.id) ? data.id : data;
  var targetStatus = (typeof data === 'object' && data !== null && data.status) ? data.status : statusParam;

  var orders = getSpecialOrders();
  for (var i = 0; i < orders.length; i++) {
    if (String(orders[i].id) === String(targetId)) {
      orders[i].status = targetStatus;
      break;
    }
  }
  try {
    PropertiesService.getScriptProperties().setProperty("APP_SPECIAL_ORDERS", JSON.stringify(orders));
  } catch(e) {}
  return { success: true };
}

function getCustomerSpecialOrders(data) {
  var orders = getSpecialOrders() || [];
  var targetMobile = String(data && (data.mobile || data.mobileNumber) || "").replace(/\D/g, '').slice(-10);
  var targetCustId = String(data && (data.customerID || data.customerId) || "").trim();

  var filtered = orders.filter(function(o) {
    var oCustId = String(o.customerId || o.customerID || "").trim();
    var oMobile = String(o.mobile || o.phone || "").replace(/\D/g, '').slice(-10);
    
    if (targetCustId && oCustId && oCustId === targetCustId) return true;
    if (targetMobile && oMobile && oMobile === targetMobile) return true;
    if (targetCustId && oMobile && targetCustId.replace(/\D/g, '').slice(-10) === oMobile) return true;
    return false;
  });

  return filtered;
}
