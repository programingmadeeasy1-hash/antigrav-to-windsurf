// ======================================================
// COUPON MANAGER
// ======================================================

function getCouponHeaders() {
  return [
    "CouponID", "Code", "DiscountType", "DiscountValue", "MinOrder", "Active",
    "ExpiryDate", "MaxUses", "UsedCount", "MaxUsesPerCustomer", "AllowedCustomers",
    "UsageLog"
  ];
}

function getCouponSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.COUPONS, getCouponHeaders());
}

function ensureCouponColumns() {
  const sheet = getCouponSheet();
  const required = getCouponHeaders().length;
  const current = sheet.getLastColumn();
  if (current < required) {
    sheet.insertColumnsAfter(current, required - current);
  }
  return sheet;
}

function parseUsageLog(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function getAllCoupons() {
  const sheet = ensureCouponColumns();
  const rows = sheet.getDataRange().getValues();
  const coupons = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] && !row[1]) continue;

    const code = String(row[1] || "").trim().toUpperCase();
    const active = String(row[5]).toUpperCase() !== "FALSE" && String(row[5]).toUpperCase() !== "NO";
    const expiryDate = row[6] ? new Date(row[6]) : null;
    const isExpired = expiryDate && expiryDate < new Date();
    const maxUses = Number(row[7]) || 0;
    const usedCount = Number(row[8]) || 0;
    const maxUsesPerCustomer = Number(row[9]) || 0;
    const allowedCustomers = String(row[10] || "").split(',').map(item => String(item).trim().toUpperCase()).filter(Boolean);
    const usageLog = parseUsageLog(row[11]);

    coupons.push({
      id: String(row[0] || ""),
      code: code,
      discountType: String(row[2] || "PERCENT").toUpperCase(),
      discountValue: Number(row[3]) || 0,
      minOrder: Number(row[4]) || 0,
      active: active && !isExpired,
      expiryDate: row[6] ? new Date(row[6]).toISOString().split("T")[0] : "",
      expired: !!isExpired,
      maxUses: maxUses,
      usedCount: usedCount,
      maxUsesPerCustomer: maxUsesPerCustomer,
      allowedCustomers: allowedCustomers,
      usageLog: usageLog
    });
  }

  return coupons;
}

function saveCoupon(data) {
  const sheet = ensureCouponColumns();
  const rows = sheet.getDataRange().getValues();
  const code = String(data.code || "").trim().toUpperCase();
  const discountType = String(data.discountType || "PERCENT").toUpperCase();
  const discountValue = Number(data.discountValue || 0);
  const minOrder = Number(data.minOrder || 0);
  const active = data.active !== false && data.active !== "FALSE" && data.active !== "NO";
  const expiryDate = data.expiryDate || "";
  const maxUses = Number(data.maxUses || 0);
  const maxUsesPerCustomer = Number(data.maxUsesPerCustomer || 0);
  const allowedCustomers = String(data.allowedCustomers || "").split(',').map(item => String(item).trim().toUpperCase()).filter(Boolean);
  const id = String(data.id || "").trim() || ("CPN" + Date.now().toString().slice(-6));

  if (!code) {
    throw new Error("Coupon code is required.");
  }

  const existingCoupon = getAllCoupons().find(item => item.id === id || item.code === code);
  const usedCount = existingCoupon ? Number(existingCoupon.usedCount || 0) : 0;
  const usageLog = existingCoupon ? existingCoupon.usageLog || {} : {};

  const rowData = [
    id, code, discountType, discountValue, minOrder, active ? "TRUE" : "FALSE",
    expiryDate, maxUses, usedCount, maxUsesPerCustomer,
    allowedCustomers.join(','), JSON.stringify(usageLog)
  ];

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id || String(rows[i][1]).toUpperCase() === code) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }

  sheet.appendRow(rowData);
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function deleteCoupon(id) {
  const sheet = ensureCouponColumns();
  const rows = sheet.getDataRange().getValues();
  const targetId = String(id && id.id ? id.id : id);

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === targetId) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true };
    }
  }

  return { success: false };
}

function getAutoCouponRules() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.AUTO_COUPON_RULES, [
    "RuleID", "RuleName", "Active", "MinOrders", "MinSpend", "MinDaysRegistered", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "CreatedOn", "LastUpdated"
  ]);
  const rows = sheet.getDataRange().getValues();
  const rules = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;
    rules.push({
      id: String(row[0]),
      ruleName: String(row[1] || ""),
      active: String(row[2]).toUpperCase() !== "FALSE" && String(row[2]).toUpperCase() !== "NO",
      minOrders: Number(row[3]) || 0,
      minSpend: Number(row[4]) || 0,
      minDaysRegistered: Number(row[5]) || 0,
      couponCode: String(row[6] || "").toUpperCase(),
      discountType: String(row[7] || "PERCENT").toUpperCase(),
      discountValue: Number(row[8]) || 0,
      minOrder: Number(row[9]) || 0,
      maxUses: Number(row[10]) || 0,
      maxUsesPerCustomer: Number(row[11]) || 0,
      allowedCustomers: String(row[12] || "").split(',').map(item => String(item).trim().toUpperCase()).filter(Boolean),
      expiryDate: row[13] || "",
      createdOn: row[14] || "",
      lastUpdated: row[15] || ""
    });
  }

  return rules;
}

function saveAutoCouponRule(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.AUTO_COUPON_RULES, [
    "RuleID", "RuleName", "Active", "MinOrders", "MinSpend", "MinDaysRegistered", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "CreatedOn", "LastUpdated"
  ]);
  const rows = sheet.getDataRange().getValues();
  const id = String(data.id || "").trim() || ("RUL" + Date.now().toString().slice(-6));
  const now = new Date();

  const rowData = [
    id,
    data.ruleName || "",
    data.active !== false && data.active !== "FALSE" && data.active !== "NO" ? "TRUE" : "FALSE",
    Number(data.minOrders || 0),
    Number(data.minSpend || 0),
    Number(data.minDaysRegistered || 0),
    String(data.couponCode || "").trim().toUpperCase(),
    String(data.discountType || "PERCENT").toUpperCase(),
    Number(data.discountValue || 0),
    Number(data.minOrder || 0),
    Number(data.maxUses || 0),
    Number(data.maxUsesPerCustomer || 0),
    String(data.allowedCustomers || ""),
    data.expiryDate || "",
    data.createdOn || now,
    now
  ];

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }

  sheet.appendRow(rowData);
  SpreadsheetApp.flush();
  return { success: true, id: id };
}

function deleteAutoCouponRule(id) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.AUTO_COUPON_RULES, [
    "RuleID", "RuleName", "Active", "MinOrders", "MinSpend", "MinDaysRegistered", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "CreatedOn", "LastUpdated"
  ]);
  const rows = sheet.getDataRange().getValues();
  const targetId = String(id && id.id ? id.id : id);

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === targetId) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true };
    }
  }
  return { success: false };
}

function getAutoCouponApprovals() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.AUTO_COUPON_APPROVALS, [
    "RequestID", "RuleID", "CustomerID", "CustomerName", "Mobile", "Reason", "Status", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "Active", "RequestedOn", "ApprovedOn"
  ]);
  const rows = sheet.getDataRange().getValues();
  const requests = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;
    requests.push({
      id: String(row[0]),
      ruleId: String(row[1] || ""),
      customerId: String(row[2] || ""),
      customerName: String(row[3] || ""),
      mobile: String(row[4] || ""),
      reason: String(row[5] || ""),
      status: String(row[6] || "PENDING"),
      couponCode: String(row[7] || ""),
      discountType: String(row[8] || "PERCENT"),
      discountValue: Number(row[9]) || 0,
      minOrder: Number(row[10]) || 0,
      maxUses: Number(row[11]) || 0,
      maxUsesPerCustomer: Number(row[12]) || 0,
      allowedCustomers: String(row[13] || "").split(',').map(item => String(item).trim().toUpperCase()).filter(Boolean),
      expiryDate: row[14] || "",
      active: String(row[15]).toUpperCase() !== "FALSE" && String(row[15]).toUpperCase() !== "NO",
      requestedOn: row[16] || "",
      approvedOn: row[17] || ""
    });
  }

  return requests.reverse();
}

function saveAutoCouponApproval(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.AUTO_COUPON_APPROVALS, [
    "RequestID", "RuleID", "CustomerID", "CustomerName", "Mobile", "Reason", "Status", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "Active", "RequestedOn", "ApprovedOn"
  ]);
  const rows = sheet.getDataRange().getValues();
  const requestId = String(data.id || "").trim() || ("APR" + Date.now().toString().slice(-6));
  const now = new Date();

  const rowData = [
    requestId,
    data.ruleId || "",
    data.customerId || "",
    data.customerName || "",
    data.mobile || "",
    data.reason || "",
    data.status || "PENDING",
    String(data.couponCode || "").trim().toUpperCase(),
    String(data.discountType || "PERCENT").toUpperCase(),
    Number(data.discountValue || 0),
    Number(data.minOrder || 0),
    Number(data.maxUses || 0),
    Number(data.maxUsesPerCustomer || 0),
    String(data.allowedCustomers || ""),
    data.expiryDate || "",
    data.active !== false && data.active !== "FALSE" && data.active !== "NO" ? "TRUE" : "FALSE",
    data.requestedOn || now,
    data.approvedOn || ""
  ];

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === requestId) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      SpreadsheetApp.flush();
      return { success: true, id: requestId };
    }
  }

  sheet.appendRow(rowData);
  SpreadsheetApp.flush();
  return { success: true, id: requestId };
}

function updateAutoCouponApprovalStatus(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.AUTO_COUPON_APPROVALS, [
    "RequestID", "RuleID", "CustomerID", "CustomerName", "Mobile", "Reason", "Status", "CouponCode", "DiscountType", "DiscountValue", "MinOrder", "MaxUses", "MaxUsesPerCustomer", "AllowedCustomers", "ExpiryDate", "Active", "RequestedOn", "ApprovedOn"
  ]);
  const rows = sheet.getDataRange().getValues();
  const targetId = String(data.id || "");
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === targetId) {
      sheet.getRange(i + 1, 7).setValue(data.status || "APPROVED");
      sheet.getRange(i + 1, 16).setValue("TRUE");
      sheet.getRange(i + 1, 18).setValue(now);

      if (data.status === "APPROVED") {
        const code = String(data.couponCode || rows[i][7] || "").toUpperCase();
        const discountVal = Number(data.discountValue || rows[i][9] || 100);
        
        sheet.getRange(i + 1, 8).setValue(code);
        sheet.getRange(i + 1, 10).setValue(discountVal);

        const couponData = {
          code: code,
          discountType: data.discountType || rows[i][8] || "FIXED",
          discountValue: discountVal,
          minOrder: Number(data.minOrder || rows[i][10] || 0),
          maxUses: Number(data.maxUses || rows[i][11] || 1),
          maxUsesPerCustomer: Number(data.maxUsesPerCustomer || rows[i][12] || 1),
          allowedCustomers: data.allowedCustomers || rows[i][13] || "",
          expiryDate: data.expiryDate || rows[i][14] || "",
          active: true
        };
        saveCoupon(couponData);

        // Dispatch notification to customer
        try {
          if (typeof pushOrderNotification === 'function') {
            const customerMobile = String(rows[i][4] || "").replace(/\D/g, "");
            pushOrderNotification({
              mobile: customerMobile,
              title: "🎉 5-Order Loyalty Reward Coupon Unlocked!",
              message: `Congratulations! Your 5-order loyalty milestone reward of ₹${discountVal} OFF has been approved by Admin. Use code ${code} on your next checkout!`,
              type: "PROMO",
              icon: "🎁"
            });
          }
        } catch(e) {
          console.warn("Notification dispatch warning:", e);
        }
      }
      SpreadsheetApp.flush();
      return { success: true };
    }
  }

  return { success: false };
}

function evaluateRegularCustomerEligibility(customer) {
  const customerId = String(customer && customer.customerId ? customer.customerId : customer && customer.id ? customer.id : "").trim();
  const customerName = String(customer && customer.name ? customer.name : "").trim();
  const mobile = String(customer && customer.mobile ? customer.mobile : "").trim();
  const rules = getAutoCouponRules().filter(rule => rule.active);

  const customerSheet = getCustomerSheet();
  const customerRows = customerSheet.getDataRange().getValues();
  const headers = getCustomerHeaders();
  const customerRow = customerRows.find(row => String(row[headers.indexOf("CustomerID")]) === customerId || cleanMobile(row[headers.indexOf("Mobile")]) === cleanMobile(mobile));

  if (!customerRow) return null;

  const registeredOn = customerRow[headers.indexOf("RegisteredOn")];
  const totalOrders = Number(customerRow[headers.indexOf("TotalOrders")]) || 0;
  const lifetimeValue = Number(customerRow[headers.indexOf("LifetimeValue")]) || 0;
  const daysRegistered = registeredOn ? Math.floor((new Date() - new Date(registeredOn)) / (1000 * 60 * 60 * 24)) : 0;

  const eligibleRules = rules.filter(rule => {
    return totalOrders >= rule.minOrders && lifetimeValue >= rule.minSpend && daysRegistered >= rule.minDaysRegistered;
  });

  if (!eligibleRules.length) return null;

  return eligibleRules.map(rule => ({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    couponCode: rule.couponCode,
    discountType: rule.discountType,
    discountValue: rule.discountValue,
    minOrder: rule.minOrder,
    maxUses: rule.maxUses,
    maxUsesPerCustomer: rule.maxUsesPerCustomer,
    allowedCustomers: rule.allowedCustomers,
    expiryDate: rule.expiryDate
  }));
}

function createRegularCustomerApprovalRequest(customer) {
  const eligibleRules = evaluateRegularCustomerEligibility(customer);
  if (!eligibleRules || !eligibleRules.length) return { success: false, message: "Customer is not yet eligible." };

  const customerId = String(customer && customer.customerId ? customer.customerId : customer && customer.id ? customer.id : "").trim();
  const customerName = String(customer && customer.name ? customer.name : "").trim();
  const mobile = String(customer && customer.mobile ? customer.mobile : "").trim();

  for (const rule of eligibleRules) {
    const approvalRequest = {
      id: "",
      ruleId: rule.ruleId,
      customerId: customerId,
      customerName: customerName,
      mobile: mobile,
      reason: `Eligible by regular-customer rule: ${rule.ruleName}`,
      status: "PENDING",
      couponCode: rule.couponCode,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
      minOrder: rule.minOrder,
      maxUses: rule.maxUses,
      maxUsesPerCustomer: rule.maxUsesPerCustomer,
      allowedCustomers: rule.allowedCustomers.join(','),
      expiryDate: rule.expiryDate,
      active: true,
      requestedOn: new Date()
    };
    saveAutoCouponApproval(approvalRequest);
  }

  return { success: true, message: "Approval request created." };
}

function markCouponUsed(data) {
  const code = String(data.code || "").trim().toUpperCase();
  if (!code) return { success: false };

  const sheet = ensureCouponColumns();
  const rows = sheet.getDataRange().getValues();
  const customerKey = String(data.customerId || data.mobile || data.customer || "").trim().toUpperCase();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toUpperCase() === code) {
      const usageLog = parseUsageLog(rows[i][11]);
      const previousCount = Number(rows[i][8]) || 0;
      const newCount = previousCount + 1;
      if (customerKey) {
        usageLog[customerKey] = (Number(usageLog[customerKey]) || 0) + 1;
      }
      sheet.getRange(i + 1, 9).setValue(newCount);
      sheet.getRange(i + 1, 12).setValue(JSON.stringify(usageLog));
      SpreadsheetApp.flush();
      return { success: true };
    }
  }

  return { success: false };
}

function validateCoupon(data) {
  const code = String(data.code || "").trim().toUpperCase();
  const subtotal = Number(data.subtotal || 0);
  const customerKey = String(data.customerId || data.mobile || data.customer || "").trim().toUpperCase();
  const coupon = getAllCoupons().find(item => item.code === code);

  if (!coupon) {
    return { valid: false, message: "Coupon code not found." };
  }

  if (!coupon.active) {
    return { valid: false, message: "Coupon is no longer active." };
  }

  if (coupon.expired) {
    return { valid: false, message: "Coupon has expired." };
  }

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "Coupon usage limit has been reached." };
  }

  if (coupon.allowedCustomers && coupon.allowedCustomers.length > 0 && customerKey && !coupon.allowedCustomers.includes(customerKey)) {
    return { valid: false, message: "This coupon is only available to selected customers." };
  }

  if (coupon.maxUsesPerCustomer > 0 && customerKey) {
    const usedByCustomer = Number(coupon.usageLog && coupon.usageLog[customerKey] ? coupon.usageLog[customerKey] : 0);
    if (usedByCustomer >= coupon.maxUsesPerCustomer) {
      return { valid: false, message: "You have already used this coupon the maximum allowed times." };
    }
  }

  if (subtotal < coupon.minOrder) {
    return { valid: false, message: "Minimum order value not reached for this coupon." };
  }

  let discount = 0;
  if (coupon.discountType === "FIXED") {
    discount = Math.min(coupon.discountValue, subtotal);
  } else {
    discount = Math.round(subtotal * (coupon.discountValue / 100));
  }

  return {
    valid: true,
    coupon: coupon,
    discount: discount,
    message: `Coupon applied! You save ₹${discount}.`
  };
}
