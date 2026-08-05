// ======================================================
// NOTIFICATION MANAGER (IN-APP ALERTS & SMS)
// ======================================================

function sendOrderConfirmationSMS(mobile, orderId, amount) {
  Logger.log(`[SMS MOCK] Order ${orderId} confirmed for ${mobile}. Total: ₹${amount}`);
  return true;
}

/**
 * Gets active in-app notifications for a customer mobile number
 */
function getUserNotifications(params) {
  try {
    const mobile = String((typeof params === 'object' && params ? params.mobile : params) || "").replace(/\D/g, "").slice(-10);
    if (!mobile) {
      return { notifications: [], unreadCount: 0 };
    }

    const key = "USER_NOTIFS_" + mobile;
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    let notifs = [];
    if (raw) {
      try { notifs = JSON.parse(raw); } catch(e) { notifs = []; }
    }

    // Default welcome notification if empty
    if (!Array.isArray(notifs) || notifs.length === 0) {
      notifs = [
        {
          id: "NOTIF_INIT_1",
          orderId: "WELCOME",
          title: "Welcome to AaharShree Naturals! 🌿",
          message: "Thank you for joining us! Experience 100% authentic, sun-dried homemade pickles crafted with traditional recipes.",
          newStatus: "Confirmed",
          type: "INFO",
          read: false,
          timestamp: new Date().toISOString()
        }
      ];
      try {
        PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(notifs));
      } catch(e) {}
    }

    const unreadCount = notifs.filter(n => !n.read).length;
    return {
      notifications: notifs,
      unreadCount: unreadCount
    };
  } catch (e) {
    console.error("getUserNotifications error: " + e.message);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Marks a single notification as read
 */
function markNotificationRead(notifId) {
  try {
    const targetId = String(notifId || "");
    const props = PropertiesService.getScriptProperties().getProperties();
    for (let key in props) {
      if (key.startsWith("USER_NOTIFS_")) {
        let list = [];
        try { list = JSON.parse(props[key]); } catch(e) {}
        let updated = false;
        for (let i = 0; i < list.length; i++) {
          if (String(list[i].id) === targetId) {
            list[i].read = true;
            updated = true;
            break;
          }
        }
        if (updated) {
          PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(list));
          break;
        }
      }
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

/**
 * Marks all notifications for a mobile number as read
 */
function markAllNotificationsRead(params) {
  try {
    const mobile = String((typeof params === 'object' && params ? params.mobile : params) || "").replace(/\D/g, "").slice(-10);
    if (!mobile) return { success: false };
    const key = "USER_NOTIFS_" + mobile;
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    if (raw) {
      let list = JSON.parse(raw);
      list.forEach(n => n.read = true);
      PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(list));
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

/**
 * Clears all notifications for a mobile number
 */
function clearNotifications(params) {
  try {
    const mobile = String((typeof params === 'object' && params ? params.mobile : params) || "").replace(/\D/g, "").slice(-10);
    if (!mobile) return { success: false };
    const key = "USER_NOTIFS_" + mobile;
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify([]));
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

/**
 * Utility to push an order status notification to a customer
 */
function pushOrderNotification(mobile, orderId, title, message, newStatus) {
  try {
    const cleanMob = String(mobile || "").replace(/\D/g, "").slice(-10);
    if (!cleanMob) return;

    const key = "USER_NOTIFS_" + cleanMob;
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    let list = raw ? JSON.parse(raw) : [];

    const newNotif = {
      id: "NOTIF_" + Date.now(),
      orderId: String(orderId),
      title: title || "Order Status Alert",
      message: message || `Your order #${orderId} status is now ${newStatus}`,
      newStatus: newStatus,
      type: newStatus === "Shipped" ? "SHIPPED_ALERT" : "STATUS_UPDATE",
      read: false,
      timestamp: new Date().toISOString()
    };

    list.unshift(newNotif);
    if (list.length > 30) list = list.slice(0, 30); // Keep last 30 alerts

    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(list));
  } catch(e) {
    console.error("pushOrderNotification error: " + e.message);
  }
}
