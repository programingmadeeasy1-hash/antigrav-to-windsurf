// ======================================================
// ORDER MANAGER
// ======================================================

function getOrderHeaders() {
  return [
    "OrderID", "CustomerID", "CustomerName", "Mobile", "Address",
    "Items", "Subtotal", "Delivery", "Discount", "GrandTotal",
    "PaymentMode", "PaymentStatus", "OrderStatus", "CouponCode", "CouponDiscount", "CreatedOn"
  ];
}

function getOrderSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.ORDERS, getOrderHeaders());
}

/**
 * Creates a new customer order
 */
function createOrder(data) {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Cannot place empty order. Please add items to your cart.");
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 10 second concurrency lock
  } catch (e) {
    throw new Error("High system traffic. Please retry placing your order in a moment.");
  }

  try {
    const sheet = getOrderSheet();
    const orderID = "ORD" + Date.now().toString().slice(-6);
    const timestamp = new Date();
    const itemsJSON = JSON.stringify(data.items);

    const subtotal = Math.round((Number(data.subtotal) || 0) * 100) / 100;
    const delivery = Math.round((Number(data.delivery) || 0) * 100) / 100;
    const discount = Math.round((Number(data.discount) || 0) * 100) / 100;
    const total = Math.round((Number(data.total || data.grandTotal) || 0) * 100) / 100;

    const row = [
      orderID,
      data.customerID || data.customerId || "",
      data.customerName || "Valued Customer",
      "'" + (data.mobile || ""),
      data.address || "",
      itemsJSON,
      subtotal,
      delivery,
      discount,
      total,
      data.paymentMode || "COD",
      data.paymentMode === "UPI" ? "PENDING_VERIFICATION" : "COD",
      CONFIG.STATUS.ORDER_PLACED,
      data.couponCode || "",
      data.couponDiscount || 0,
      timestamp
    ];

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    // 1. Coupon Usage Tracking
    if (data.couponCode) {
      try {
        markCouponUsed({
          code: data.couponCode,
          customerId: data.customerID || data.customerId,
          mobile: data.mobile
        });
      } catch (e) {
        console.warn("Coupon usage update skipped:", e);
      }
    }

    // 2. Point Earning & Redemption (1 Point per ₹25 Spent)
    const pointsEarned = Math.floor(subtotal / 25);
    const pointsRedeemed = Math.max(0, Number(data.pointsRedeemed) || 0);
    const netPointsDelta = pointsEarned - pointsRedeemed;

    try {
      if (typeof updateCustomerRewardPoints === 'function' && data.mobile) {
        updateCustomerRewardPoints(data.mobile, netPointsDelta);
      }
    } catch(e) {
      console.warn("Reward points update skipped:", e);
    }

    // 3. Customer Total Orders, Lifetime Value & 5-Order Milestone Trigger
    try {
      if (typeof findCustomerByMobile === 'function' && data.mobile) {
        const customerObj = findCustomerByMobile(data.mobile);
        if (customerObj) {
          const custHeaders = getCustomerHeaders();
          const custSheet = getCustomerSheet();
          const ordersCol = custHeaders.indexOf("TotalOrders");
          const ltvCol = custHeaders.indexOf("LifetimeValue");
          const lastOrderCol = custHeaders.indexOf("LastOrder");

          const currentOrders = Number(customerObj.data[ordersCol]) || 0;
          const currentLtv = Number(customerObj.data[ltvCol]) || 0;
          const newOrders = currentOrders + 1;
          const newLtv = currentLtv + total;

          if (ordersCol >= 0) custSheet.getRange(customerObj.row, ordersCol + 1).setValue(newOrders);
          if (ltvCol >= 0) custSheet.getRange(customerObj.row, ltvCol + 1).setValue(newLtv);
          if (lastOrderCol >= 0) custSheet.getRange(customerObj.row, lastOrderCol + 1).setValue(timestamp);
          SpreadsheetApp.flush();

          // Trigger 5-Order Milestone Approval Queue Request (every 5, 10, 15, 20... orders)
          if (newOrders % 5 === 0) {
            try {
              if (typeof saveAutoCouponApproval === 'function') {
                saveAutoCouponApproval({
                  id: "",
                  ruleId: "MILESTONE-5-ORDERS",
                  customerId: data.customerID || data.customerId || ("CUS-" + data.mobile.slice(-4)),
                  customerName: data.customerName || "Valued Customer",
                  mobile: data.mobile,
                  reason: `Reached 5-Order Loyalty Milestone (${newOrders} Total Completed Orders)`,
                  status: "PENDING",
                  couponCode: `LOYALTY${newOrders}-${data.mobile.slice(-4)}`,
                  discountType: "FIXED",
                  discountValue: 100, // Default ₹100 OFF, Admin can adjust before approval
                  minOrder: 0,
                  maxUses: 1,
                  maxUsesPerCustomer: 1,
                  allowedCustomers: data.mobile,
                  expiryDate: "",
                  active: true,
                  requestedOn: timestamp
                });
              }
            } catch(mErr) {
              console.warn("Milestone approval request warning:", mErr);
            }
          }
        }
      }
    } catch(e) {
      console.warn("Customer stats update warning:", e);
    }

    return { 
      success: true, 
      orderId: orderID,
      pointsEarned: pointsEarned,
      pointsRedeemed: pointsRedeemed 
    };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

/**
 * Gets orders for Admin view
 */
function getAllOrders() {
  const sheet = getOrderSheet();
  const rows = sheet.getDataRange().getValues();
  const orders = [];

  for (let i = 1; i < rows.length; i++) {
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(rows[i][5]);
    } catch (e) {
      parsedItems = [];
    }

    orders.push({
      orderId: rows[i][0],
      customerName: rows[i][2],
      mobile: rows[i][3],
      address: rows[i][4],
      items: parsedItems,
      subtotal: rows[i][6],
      delivery: rows[i][7],
      discount: rows[i][8],
      grandTotal: rows[i][9],
      paymentMode: rows[i][10],
      paymentStatus: rows[i][11],
      orderStatus: rows[i][12],
      couponCode: rows[i][13],
      couponDiscount: rows[i][14],
      createdOn: rows[i][15] ? new Date(rows[i][15]).toLocaleDateString() : ""
    });
  }

  return orders.reverse(); // Newest first
}

/**
 * Gets orders for a specific Customer
 */
function getCustomerOrders(data) {
  const sheet = getOrderSheet();
  const rows = sheet.getDataRange().getValues();
  const orders = [];
  const searchMobile = String(data && (data.mobile || data.customerMobile) || '').replace(/\D/g, '').slice(-10);
  const searchCustId = String(data && (data.customerID || data.customerId) || '').trim();

  for (let i = 1; i < rows.length; i++) {
    const rowCustId = String(rows[i][1] || '').trim();
    const rowMobile = String(rows[i][3] || '').replace(/\D/g, '').slice(-10);

    let match = false;
    if (searchCustId && rowCustId && searchCustId === rowCustId) match = true;
    if (!match && searchMobile && rowMobile && searchMobile === rowMobile) match = true;
    if (!match && searchCustId && rowMobile && searchCustId.replace(/\D/g, '').slice(-10) === rowMobile) match = true;

    if (match) {
      let parsedItems = [];
      try { parsedItems = JSON.parse(rows[i][5]); } catch (e) {}

      orders.push({
        orderId: rows[i][0],
        id: rows[i][0],
        customerId: rows[i][1],
        customerID: rows[i][1],
        customerName: rows[i][2],
        mobile: rows[i][3],
        address: rows[i][4],
        items: parsedItems,
        subtotal: rows[i][6],
        delivery: rows[i][7],
        discount: rows[i][8],
        grandTotal: rows[i][9],
        total: rows[i][9],
        paymentMode: rows[i][10],
        paymentStatus: rows[i][11],
        orderStatus: rows[i][12],
        couponCode: rows[i][13],
        couponDiscount: rows[i][14],
        createdOn: rows[i][15] ? new Date(rows[i][15]).toLocaleDateString() : ""
      });
    }
  }

  return orders.reverse();
}

/**
 * Updates status of an order (Admin control)
 */
function updateOrderStatus(data) {
  const sheet = getOrderSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = getOrderHeaders();
  const idCol = headers.indexOf("OrderID");
  const mobileCol = headers.indexOf("Mobile");
  const statusCol = headers.indexOf("OrderStatus");
  const targetId = String(data.orderId);
  const newStatus = String(data.newStatus || "");

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol >= 0 ? idCol : 0]) === targetId) {
      sheet.getRange(i + 1, (statusCol >= 0 ? statusCol : 12) + 1).setValue(newStatus);
      SpreadsheetApp.flush();

      // Trigger automatic status notification to customer
      const mobile = String(rows[i][mobileCol >= 0 ? mobileCol : 3] || "");
      if (mobile && typeof pushOrderNotification === "function") {
        pushOrderNotification(
          mobile,
          targetId,
          "Order #" + targetId + " Updated! 📦",
          "Your order status has been updated to " + newStatus,
          newStatus
        );
      }

      return { success: true };
    }
  }
  throw new Error("Order ID not found.");
}
