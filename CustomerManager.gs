// ======================================================
// CUSTOMER MANAGER (UPDATED)
// ======================================================

function getCustomerHeaders() {
  return [
    "CustomerID", "Name", "Mobile", "Password", "Email",
    "House", "Street", "Area", "Landmark", "City", "State", "PIN",
    "Latitude", "Longitude", "RegisteredOn", "RegistrationDate", "LastLogin", "LastOrder",
    "TotalOrders", "LifetimeValue", "Status", "RewardPoints"
  ];
}

function getCustomerRewardBalance(mobile) {
  const customer = findCustomerByMobile(mobile);
  if (!customer) return 0;
  const headers = getCustomerHeaders();
  const pointsCol = headers.indexOf("RewardPoints");
  if (pointsCol >= 0 && customer.data[pointsCol] !== undefined) {
    return Math.max(0, Number(customer.data[pointsCol]) || 0);
  }
  return 0;
}

function updateCustomerRewardPoints(mobile, deltaPoints) {
  const customer = findCustomerByMobile(mobile);
  if (!customer) return 0;
  const headers = getCustomerHeaders();
  const sheet = getCustomerSheet();
  let pointsCol = headers.indexOf("RewardPoints");
  if (pointsCol < 0) {
    pointsCol = headers.length;
    sheet.getRange(1, pointsCol + 1).setValue("RewardPoints");
  }

  const currentPoints = Math.max(0, Number(customer.data[pointsCol]) || 0);
  const newPoints = Math.max(0, currentPoints + deltaPoints);

  sheet.getRange(customer.row, pointsCol + 1).setValue(newPoints);
  SpreadsheetApp.flush();
  return newPoints;
}

function getCustomerSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.CUSTOMERS, getCustomerHeaders(), ["Customers", "Customer", "CustomerData"]);
}

function findCustomerByMobile(mobile) {
  const sheet = getCustomerSheet();
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return null;

  const headerRow = rows[0];
  const mobileIndex = findColumnIndex(headerRow, "Mobile");
  const mIdx = mobileIndex >= 0 ? mobileIndex : 2;
  const searchMobile = cleanMobile(mobile); // Uses helper from Utils.gs

  for (let i = 1; i < rows.length; i++) {
    const cellValue = rows[i][mIdx];
    if (cleanMobile(cellValue) === searchMobile) {
      return { row: i + 1, data: rows[i] };
    }
  }
  return null;
}

function registerCustomer(dataInput, nameParam, passwordParam, emailParam) {
  var data = {};
  if (typeof dataInput === 'string') {
    try {
      data = JSON.parse(dataInput);
    } catch(e) {
      data = {
        mobile: dataInput,
        name: nameParam || "",
        password: passwordParam || "",
        email: emailParam || ""
      };
    }
  } else if (dataInput && typeof dataInput === 'object') {
    data = dataInput;
  }

  const mobile = cleanMobile(data.mobile || data.phone || data.identifier || "");
  if (!mobile) {
    throw new Error("Please provide a valid 10-digit mobile number for registration.");
  }

  const sheet = getCustomerSheet();
  if (findCustomerByMobile(mobile)) {
    throw new Error("This mobile number is already registered. Please sign in instead.");
  }

  const customerID = generateUniqueId("CUS"); // Uses helper from Utils.gs
  const headers = getCustomerHeaders();
  const newRow = new Array(headers.length).fill("");

  // Map data to correct columns based on headers
  newRow[headers.indexOf("CustomerID")] = customerID;
  newRow[headers.indexOf("Name")] = data.name || "Customer";
  newRow[headers.indexOf("Mobile")] = mobile;
  newRow[headers.indexOf("Password")] = data.password || "123456";
  newRow[headers.indexOf("Email")] = data.email || "";
  const registeredOn = new Date();
  newRow[headers.indexOf("RegisteredOn")] = registeredOn;
  if (headers.indexOf("RegistrationDate") >= 0) {
    newRow[headers.indexOf("RegistrationDate")] = registeredOn;
  }
  newRow[headers.indexOf("TotalOrders")] = 0;
  newRow[headers.indexOf("LifetimeValue")] = 0;
  newRow[headers.indexOf("Status")] = "ACTIVE";

  sheet.appendRow(newRow);
  SpreadsheetApp.flush();

  return {
    success: true,
    customerId: customerID,
    name: data.name || "Customer",
    mobile: mobile
  };
}

function saveCustomer(data) {
  return registerCustomer(data);
}

function loginCustomer(mobile, password) {
  const customer = findCustomerByMobile(mobile);
  if (!customer) return null;

  const row = customer.data;
  const sheet = getCustomerSheet();
  const headerRow = sheet.getDataRange().getValues()[0];
  
  const passwordIndex = findColumnIndex(headerRow, "Password");
  const lastLoginCol = findColumnIndex(headerRow, "LastLogin");
  const idIndex = findColumnIndex(headerRow, "CustomerID");
  const nameIndex = findColumnIndex(headerRow, "Name");
  const mobIndex = findColumnIndex(headerRow, "Mobile");
  const emailIndex = findColumnIndex(headerRow, "Email");

  const pIdx = passwordIndex >= 0 ? passwordIndex : 3;
  const lIdx = lastLoginCol >= 0 ? lastLoginCol : 16;
  const idIdx = idIndex >= 0 ? idIndex : 0;
  const nIdx = nameIndex >= 0 ? nameIndex : 1;
  const mIdx = mobIndex >= 0 ? mobIndex : 2;
  const eIdx = emailIndex >= 0 ? emailIndex : 4;

  if (String(row[pIdx]).trim() !== String(password).trim()) {
    return null;
  }

  // Update Last Login
  if (lIdx >= 0) {
    sheet.getRange(customer.row, lIdx + 1).setValue(new Date());
  }

  // Address helper
  const addrCols = ["House", "Street", "Area", "Landmark", "City", "State", "PIN"];
  const fullAddress = addrCols.map(col => {
    const colIdx = findColumnIndex(headerRow, col);
    return colIdx >= 0 ? row[colIdx] : "";
  }).filter(val => !!val).join(", ");

  return {
    customerId: row[idIdx],
    id: row[idIdx],
    name: row[nIdx],
    mobile: row[mIdx],
    email: row[eIdx],
    fullAddress: fullAddress
  };
}

function getAllCustomers() {
  const sheet = getCustomerSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = getCustomerHeaders();
  const customers = [];

  for (let i = 1; i < rows.length; i++) {
    const addrCols = ["House", "Street", "Area", "Landmark", "City", "State", "PIN"];
    const fullAddress = addrCols.map(col => rows[i][headers.indexOf(col)]).filter(val => !!val).join(", ");

    customers.push({
      customerId: rows[i][headers.indexOf("CustomerID")],
      name: rows[i][headers.indexOf("Name")],
      mobile: rows[i][headers.indexOf("Mobile")],
      email: rows[i][headers.indexOf("Email")],
      fullAddress: fullAddress,
      registeredOn: formatDate(rows[i][headers.indexOf("RegisteredOn")]),
      status: rows[i][headers.indexOf("Status")] || "ACTIVE"
    });
  }
  return customers;
}

function getCustomerStatsForAutoCoupon(customer) {
  const customerId = String(customer && customer.customerId ? customer.customerId : customer && customer.id ? customer.id : "").trim();
  const mobile = String(customer && customer.mobile ? customer.mobile : "").trim();
  const sheet = getCustomerSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = getCustomerHeaders();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[headers.indexOf("CustomerID")]) === customerId || cleanMobile(row[headers.indexOf("Mobile")]) === cleanMobile(mobile)) {
      const registeredOn = row[headers.indexOf("RegisteredOn")] || row[headers.indexOf("RegistrationDate")] || "";
      const totalOrders = Number(row[headers.indexOf("TotalOrders")]) || 0;
      const lifetimeValue = Number(row[headers.indexOf("LifetimeValue")]) || 0;
      const daysRegistered = registeredOn ? Math.floor((new Date() - new Date(registeredOn)) / (1000 * 60 * 60 * 24)) : 0;
      return { totalOrders, lifetimeValue, daysRegistered };
    }
  }

  return { totalOrders: 0, lifetimeValue: 0, daysRegistered: 0 };
}