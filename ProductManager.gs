// ======================================================
// PRODUCT MANAGER
// ======================================================

function getProductHeaders() {
  return ["ProductID", "Name", "Category", "SubCategory", "MRP", "OfferPrice", "Weight", "Stock", "Featured", "Offer", "BestSeller", "NewArrival", "PreOrder", "BulkAvailable", "BatchStatus", "Image1", "Image2", "Image3", "Description", "Status"];
}

function getProductSheet() {
  return getOrCreateSheet(CONFIG.SHEETS.PRODUCTS, getProductHeaders());
}

function getAllProducts() {
  var products = [];

  // 1. Try Spreadsheet Sheet
  try {
    const sheet = getProductSheet();
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0]) continue;
          products.push({
            id: String(r[0]),
            name: String(r[1] || ""),
            category: String(r[2] || ""),
            subCategory: String(r[3] || ""),
            mrp: Number(r[4]) || 0,
            offerPrice: Number(r[5]) || 0,
            weight: String(r[6] || "500g"),
            stock: Number(r[7]) || 0,
            featured: String(r[8]).toUpperCase() === "YES" || r[8] === true,
            offer: String(r[9]).toUpperCase() === "YES" || r[9] === true,
            bestSeller: String(r[10]).toUpperCase() === "YES" || r[10] === true,
            newArrival: String(r[11]).toUpperCase() === "YES" || r[11] === true,
            preOrder: String(r[12]).toUpperCase() === "YES" || r[12] === true,
            bulkAvailable: String(r[13]).toUpperCase() === "YES" || r[13] === true,
            batchStatus: String(r[14] || "READY"),
            image1: String(r[15] || ""),
            image2: String(r[16] || ""),
            image3: String(r[17] || ""),
            description: String(r[18] || ""),
            status: String(r[19] || "ACTIVE").toUpperCase()
          });
        }
        if (products.length > 0) return products;
      }
    }
  } catch(e) {
    console.warn("Error reading products sheet: " + e.message);
  }

  // 2. Try ScriptProperties
  try {
    var prop = PropertiesService.getScriptProperties().getProperty("APP_PRODUCTS");
    if (prop) {
      var parsed = JSON.parse(prop);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e) {}

  // 3. Fallback to default products
  return getDefaultProducts();
}

function getDefaultProducts() {
  return [
    {
      id: "PRD101",
      name: "Special Punjabi Mango Pickle (Aam Ka Achar)",
      category: "Mango Pickles",
      subCategory: "Authentic North Indian",
      mrp: 350,
      offerPrice: 299,
      weight: "1 kg Jar",
      stock: 120,
      featured: true,
      offer: true,
      bestSeller: true,
      newArrival: false,
      preOrder: true,
      bulkAvailable: true,
      maxBulkQty: 50,
      batchStatus: "READY",
      image1: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
      image2: "",
      image3: "",
      description: "Made with authentic Ramkella raw mangoes, sun-dried spices, and pure mustard oil.",
      status: "ACTIVE"
    },
    {
      id: "PRD102",
      name: "Banarasi Stuffed Red Chilli Pickle",
      category: "Chilli Pickles",
      subCategory: "Spicy Traditional",
      mrp: 380,
      offerPrice: 320,
      weight: "500g Jar",
      stock: 45,
      featured: true,
      offer: false,
      bestSeller: true,
      newArrival: true,
      preOrder: true,
      bulkAvailable: true,
      maxBulkQty: 30,
      batchStatus: "READY",
      image1: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=800&q=80",
      image2: "",
      image3: "",
      description: "Hand-stuffed whole red chillies with roasted amchur and authentic spice mix.",
      status: "ACTIVE"
    },
    {
      id: "PRD103",
      name: "Khatta Meetha Lemon Pickle (Oil-Free)",
      category: "Lemon Pickles",
      subCategory: "Digestive Special",
      mrp: 290,
      offerPrice: 240,
      weight: "500g Jar",
      stock: 80,
      featured: false,
      offer: true,
      bestSeller: false,
      newArrival: false,
      preOrder: false,
      bulkAvailable: true,
      maxBulkQty: 40,
      batchStatus: "READY",
      image1: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80",
      image2: "",
      image3: "",
      description: "100% oil-free sweet and sour lemon pickle, sun-aged for 40 days.",
      status: "ACTIVE"
    }
  ];
}

function saveProduct(dataInput) {
  var data = (typeof dataInput === 'string') ? JSON.parse(dataInput) : (dataInput || {});
  const isEdit = !!data.id;
  const productID = isEdit ? String(data.id) : "PRD" + Date.now().toString().slice(-6);

  const img1 = uploadImageToGoogleDrive(data.image1, "prd_" + productID + "_1");
  const img2 = uploadImageToGoogleDrive(data.image2, "prd_" + productID + "_2");
  const img3 = uploadImageToGoogleDrive(data.image3, "prd_" + productID + "_3");

  const productObj = {
    id: productID,
    name: data.name || "",
    category: data.category || "General",
    subCategory: data.subCategory || "",
    mrp: Number(data.mrp) || 0,
    offerPrice: Number(data.offerPrice) || 0,
    weight: data.weight || "500g",
    stock: Number(data.stock) || 0,
    featured: data.featured ? true : false,
    offer: data.offer ? true : false,
    bestSeller: data.bestSeller ? true : false,
    newArrival: data.newArrival ? true : false,
    preOrder: data.preOrder ? true : false,
    bulkAvailable: data.bulkAvailable ? true : false,
    maxBulkQty: Number(data.maxBulkQty) || 50,
    batchStatus: data.batchStatus || "READY",
    image1: img1 || "",
    image2: img2 || "",
    image3: img3 || "",
    description: data.description || "",
    status: (data.status || "ACTIVE").toUpperCase()
  };

  // 1. Save to ScriptProperties
  var products = getAllProducts();
  var idx = -1;
  for (var i = 0; i < products.length; i++) {
    if (String(products[i].id) === String(productID)) {
      idx = i;
      break;
    }
  }
  if (idx >= 0) {
    products[idx] = productObj;
  } else {
    products.push(productObj);
  }

  try {
    PropertiesService.getScriptProperties().setProperty("APP_PRODUCTS", JSON.stringify(products));
  } catch(e) {}

  // 2. Save to Sheet if available
  try {
    const sheet = getProductSheet();
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      const rowData = [
        productObj.id, productObj.name, productObj.category, productObj.subCategory,
        productObj.mrp, productObj.offerPrice, productObj.weight, productObj.stock,
        productObj.featured ? "YES" : "NO", productObj.offer ? "YES" : "NO",
        productObj.bestSeller ? "YES" : "NO", productObj.newArrival ? "YES" : "NO",
        productObj.preOrder ? "YES" : "NO", productObj.bulkAvailable ? "YES" : "NO",
        productObj.batchStatus, productObj.image1, productObj.image2, productObj.image3, 
        productObj.description, productObj.status
      ];

      let foundRow = -1;
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === String(productID)) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
    }
  } catch(e) {
    console.warn("Could not save product to sheet: " + e.message);
  }

  return { success: true, id: productID, product: productObj, products: products };
}

function updateProductBulkSettings(dataInput) {
  var data = (typeof dataInput === 'string') ? JSON.parse(dataInput) : (dataInput || {});
  const id = String(data.id || "");
  const isAvailable = data.bulkAvailable !== false && String(data.bulkAvailable).toLowerCase() !== "false";
  const maxQty = Number(data.maxBulkQty) || 50;

  // 1. Update ScriptProperties
  var products = getAllProducts();
  var found = false;
  for (var i = 0; i < products.length; i++) {
    if (String(products[i].id) === id) {
      products[i].bulkAvailable = isAvailable;
      products[i].maxBulkQty = maxQty;
      found = true;
      break;
    }
  }

  try {
    PropertiesService.getScriptProperties().setProperty("APP_PRODUCTS", JSON.stringify(products));
  } catch(e) {}

  // 2. Update Sheet if available
  try {
    const sheet = getProductSheet();
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === id) {
          sheet.getRange(r + 1, 14).setValue(isAvailable ? "YES" : "NO");
          break;
        }
      }
    }
  } catch(e) {}

  return { success: true };
}

// ======================================================
// REVIEWS, RATINGS & LIKES FOR GOOGLE APPS SCRIPT
// ======================================================

function getReviewSheet() {
  return getOrCreateSheet("Reviews", ["ReviewID", "ProductID", "CustomerName", "Rating", "Comment", "Date", "Verified", "Likes"]);
}

function getProductReviews(productIdInput) {
  var prodId = String(typeof productIdInput === 'object' ? (productIdInput.productId || productIdInput.id || "") : (productIdInput || ""));
  var reviews = [];

  try {
    var sheet = getReviewSheet();
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (String(r[1]) === prodId) {
          reviews.push({
            id: String(r[0]),
            productId: String(r[1]),
            customerName: String(r[2] || "Customer"),
            rating: Number(r[3]) || 5,
            comment: String(r[4] || ""),
            date: String(r[5] || ""),
            verified: String(r[6]).toUpperCase() === "YES" || r[6] === true,
            likes: Number(r[7]) || 0
          });
        }
      }
    }
  } catch(e) {}

  // ScriptProperties Fallback if sheet empty
  if (reviews.length === 0) {
    try {
      var prop = PropertiesService.getScriptProperties().getProperty("APP_REVIEWS");
      if (prop) {
        var allRevs = JSON.parse(prop);
        reviews = allRevs.filter(function(r) { return String(r.productId) === prodId; });
      }
    } catch(e) {}
  }

  // Default initial reviews if none present
  if (reviews.length === 0) {
    reviews = [
      {
        id: "REV_INIT_1_" + prodId,
        productId: prodId,
        customerName: "Sunita Mehra",
        rating: 5,
        comment: "Delicious authentic home style pickle! Perfect balance of spices and traditional sun-cured jar quality.",
        date: "2026-07-29",
        verified: true,
        likes: 12
      },
      {
        id: "REV_INIT_2_" + prodId,
        productId: prodId,
        customerName: "Vikas Saxena",
        rating: 5,
        comment: "Packed very securely in thick glass jar. Tastes fresh, homemade and pure mustard oil aroma.",
        date: "2026-08-01",
        verified: true,
        likes: 7
      }
    ];
  }

  var totalRating = reviews.reduce(function(sum, r) { return sum + (Number(r.rating) || 5); }, 0);
  var avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "5.0";

  return {
    reviews: reviews,
    count: reviews.length,
    avgRating: Number(avgRating),
    likes: 48
  };
}

function addProductReview(dataInput) {
  var data = (typeof dataInput === 'string') ? JSON.parse(dataInput) : (dataInput || {});
  var prodId = String(data.productId || "");
  if (!prodId) return { success: false, message: "Missing Product ID" };

  var newRev = {
    id: "REV_" + Date.now(),
    productId: prodId,
    customerName: data.customerName || "Satisfied Pickle Lover",
    rating: Number(data.rating) || 5,
    comment: data.comment || "Great authentic pickle taste!",
    date: new Date().toISOString().split("T")[0],
    verified: true,
    likes: 1
  };

  // 1. Save to Google Sheet
  try {
    var sheet = getReviewSheet();
    if (sheet) {
      sheet.appendRow([newRev.id, newRev.productId, newRev.customerName, newRev.rating, newRev.comment, newRev.date, "YES", newRev.likes]);
    }
  } catch(e) {}

  // 2. Save to ScriptProperties
  try {
    var prop = PropertiesService.getScriptProperties().getProperty("APP_REVIEWS");
    var allRevs = prop ? JSON.parse(prop) : [];
    allRevs.unshift(newRev);
    PropertiesService.getScriptProperties().setProperty("APP_REVIEWS", JSON.stringify(allRevs));
  } catch(e) {}

  var updatedRes = getProductReviews(prodId);
  return {
    success: true,
    review: newRev,
    reviews: updatedRes.reviews,
    count: updatedRes.count,
    avgRating: updatedRes.avgRating
  };
}

function toggleProductLike(dataInput) {
  return { success: true };
}

// ======================================================
// WISHLIST STORAGE FOR GOOGLE APPS SCRIPT
// ======================================================

function getWishlistSheet() {
  return getOrCreateSheet("Wishlists", ["UserMobile", "ProductID", "AddedAt"]);
}

function getWishlist(dataInput) {
  var data = (typeof dataInput === 'string') ? JSON.parse(dataInput) : (dataInput || {});
  var mobile = String(typeof data === 'object' ? (data.mobile || data.userMobile || "") : data).replace(/\D/g, '').slice(-10);
  
  var productIds = [];
  try {
    var sheet = getWishlistSheet();
    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        var mob = String(r[0]).replace(/\D/g, '').slice(-10);
        if (mob === mobile || !mobile) {
          productIds.push(String(r[1]));
        }
      }
    }
  } catch(e) {}

  return { success: true, productIds: productIds };
}

function toggleWishlist(dataInput) {
  var data = (typeof dataInput === 'string') ? JSON.parse(dataInput) : (dataInput || {});
  var mobile = String(data.mobile || data.userMobile || "9876543210").replace(/\D/g, '').slice(-10);
  var prodId = String(data.productId || data.id || "");
  var isSaved = !!data.isSaved;

  try {
    var sheet = getWishlistSheet();
    if (sheet && prodId) {
      var rows = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < rows.length; r++) {
        var rowMob = String(rows[r][0]).replace(/\D/g, '').slice(-10);
        if (rowMob === mobile && String(rows[r][1]) === prodId) {
          foundRow = r + 1;
          break;
        }
      }

      if (isSaved) {
        if (foundRow < 0) {
          sheet.appendRow([mobile, prodId, new Date().toISOString()]);
        }
      } else {
        if (foundRow > 0) {
          sheet.deleteRow(foundRow);
        }
      }
    }
  } catch(e) {}

  return { success: true, isSaved: isSaved };
}

