// ======================================================
// SERVER-SIDE AUTHENTICATION
// ======================================================

function authenticateUser(credentials) {
  try {
    var creds = (typeof credentials === 'string') ? JSON.parse(credentials) : (credentials || {});
    const username = String(creds.username || creds.identifier || creds.email || creds.mobile || "").trim();
    const password = String(creds.password || "").trim();

    if (!username || !password) {
      return { success: false, message: "Please provide both credentials." };
    }

    // 1. Check Admin Login First
    if (typeof loginAdmin === "function") {
      const admin = loginAdmin(username, password); 
      if (admin) {
        return {
          success: true,
          role: admin.role,
          destination: "ADMIN",
          user: admin
        };
      }
    } 
    
    // 2. Check Customer Login (Mobile or Email)
    if (typeof loginCustomer === "function") {
      const customer = loginCustomer(username, password); 
      if (customer) {
        return {
          success: true,
          role: CONFIG.ROLES.CUSTOMER,
          destination: "CUSTOMER",
          user: customer
        };
      }
    }

    return {
      success: false,
      message: "Invalid credentials. If you are a new user, please register."
    };
    
  } catch (e) {
    console.error("Auth Error: " + e.message);
    return {
      success: false,
      message: "Authentication error: " + e.message
    };
  }
}

function loginUser(credentials) {
  return authenticateUser(credentials);
}

function registerUser(userData) {
  if (typeof registerCustomer === "function") {
    return registerCustomer(userData);
  }
  if (typeof saveCustomer === "function") {
    return saveCustomer(userData);
  }
  return { success: false, message: "Customer registration function not available." };
}
