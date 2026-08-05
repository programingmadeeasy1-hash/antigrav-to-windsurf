// ======================================================
// CONFIGURATION
// ======================================================

const CONFIG = {
  BUSINESS_NAME: "AaharShree Naturals",
  // Ensure this ID belongs to a sheet owned by or shared with your NEW Google ID
  SPREADSHEET_ID: "10mrtKz4gWbFRbHeAum5_NS2n9VNb95b9nayeCa8WwSQ",
  VERSION: "3.1.1", // Incremented for update
  
  ROLES: {
    CUSTOMER: "CUSTOMER",
    ADMIN: "ADMIN",
    TIER1: "TIER1_MASTER",
    TIER2: "TIER2_MANAGER",
    TIER3: "TIER3_STAFF"
  },
  
  SHEETS: {
    PRODUCTS: "Products",
    VARIANTS: "Variants",
    ORDERS: "Orders",
    COUPONS: "Coupons",
    INVENTORY: "Inventory",
    CUSTOMERS: "Customers",
    CATEGORIES: "Categories",
    SETTINGS: "Settings",
    ADMIN: "AdminUsers",
    SLIDERS: "HeroSliders",
    BATCHES: "PreOrderBatches",
    SPECIAL_ORDERS: "SpecialOrders",
    AUTO_COUPON_RULES: "AutoCouponRules",
    AUTO_COUPON_APPROVALS: "AutoCouponApprovals"
  },
  
  STATUS: {
    ACTIVE: "ACTIVE",
    DRAFT: "DRAFT",
    DISABLED: "DISABLED",
    ORDER_PLACED: "Order Placed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
  }
};

// Global variables for legacy support
const BUSINESS_NAME = CONFIG.BUSINESS_NAME;
const SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;