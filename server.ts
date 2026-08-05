import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ======================================================
// IN-MEMORY DATA STORE
// ======================================================

let products = [
  {
    id: "PRD101",
    name: "Ramkella Raw Mango Pickle",
    category: "Mango Pickles",
    subCategory: "Traditional",
    mrp: 299,
    offerPrice: 249,
    weight: "500g Jar",
    stock: 50,
    featured: true,
    offer: true,
    bestSeller: true,
    newArrival: false,
    preOrder: "NO",
    bulkAvailable: "YES",
    batchStatus: "READY",
    image1: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
    image2: "",
    image3: "",
    description: "Authentic homemade Ramkella raw mango pickle prepared with mustard oil and traditional spices.",
    status: "ACTIVE"
  },
  {
    id: "PRD102",
    name: "Sun-Aged Spicy Lemon Pickle",
    category: "Lemon Pickles",
    subCategory: "Sun Dried",
    mrp: 249,
    offerPrice: 199,
    weight: "500g Jar",
    stock: 40,
    featured: true,
    offer: true,
    bestSeller: false,
    newArrival: false,
    preOrder: "NO",
    bulkAvailable: "YES",
    batchStatus: "READY",
    image1: "https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=800&q=80",
    image2: "",
    image3: "",
    description: "Sun-fermented paper-thin lemon pickle infused with rock salt and roasted cumin.",
    status: "ACTIVE"
  },
  {
    id: "PRD103",
    name: "Spicy Stuffed Red Chilli Pickle",
    category: "Stuffed Pickles",
    subCategory: "Banarasi Special",
    mrp: 349,
    offerPrice: 299,
    weight: "500g Jar",
    stock: 30,
    featured: false,
    offer: false,
    bestSeller: false,
    newArrival: true,
    preOrder: "NO",
    bulkAvailable: "YES",
    batchStatus: "READY",
    image1: "https://images.unsplash.com/photo-1599909631369-02eb644910e5?auto=format&fit=crop&w=800&q=80",
    image2: "",
    image3: "",
    description: "Plump Banarasi red chillies hand-stuffed with aromatic ground spices and mustard oil.",
    status: "ACTIVE"
  },
  {
    id: "PRD104",
    name: "Mixed Farm Vegetables Pickle",
    category: "Mixed Pickles",
    subCategory: "Crunchy",
    mrp: 279,
    offerPrice: 229,
    weight: "500g Jar",
    stock: 25,
    featured: true,
    offer: true,
    bestSeller: false,
    newArrival: false,
    preOrder: "NO",
    bulkAvailable: "YES",
    batchStatus: "READY",
    image1: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
    image2: "",
    image3: "",
    description: "Medley of fresh carrots, cauliflower, green chillies and turnip fermented to perfection.",
    status: "ACTIVE"
  }
];

let categories = [
  { id: "CAT101", name: "Mango Pickles", icon: "🥭", imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500", banner: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800", priority: 1, visible: true, status: "ACTIVE", description: "Handmade Raw Mango Pickles" },
  { id: "CAT102", name: "Lemon Pickles", icon: "🍋", imageUrl: "https://images.unsplash.com/photo-1590005354167-6da97870c757?w=500", banner: "https://images.unsplash.com/photo-1590005354167-6da97870c757?w=800", priority: 2, visible: true, status: "ACTIVE", description: "Tangy Sun-Aged Lemon Pickles" },
  { id: "CAT103", name: "Stuffed Pickles", icon: "🌶️", imageUrl: "https://images.unsplash.com/photo-1599909631369-02eb644910e5?w=500", banner: "https://images.unsplash.com/photo-1599909631369-02eb644910e5?w=800", priority: 3, visible: true, status: "ACTIVE", description: "Banarasi Stuffed Chillies" },
  { id: "CAT104", name: "Mixed Pickles", icon: "🥕", imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500", banner: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800", priority: 4, visible: true, status: "ACTIVE", description: "Farm Fresh Mixed Pickles" }
];

let sliders = [
  {
    id: "SLD101",
    title: "100% Homemade Authentic Taste",
    badge: "Ramkella Raw Mango Special",
    subtitle: "Made with Real Ingredients • Packed with Purity",
    imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
    actionType: "CATEGORY",
    actionValue: "Mango Pickles",
    active: true,
    order: 1
  },
  {
    id: "SLD102",
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

let preOrderBatches = [
  {
    id: "BATCH2026_1",
    batchNumber: "BATCH-2026-A1",
    productName: "Ramkella Raw Mango Solar-Aged Batch #2026",
    tag: "Solar Fermented",
    totalStock: 100,
    bookedCount: 35,
    deliveryEstimate: "Ships within 5 days",
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500",
    createdAt: new Date().toISOString()
  }
];

let settings: Record<string, any> = {
  DELIVERY_CHARGE: 50,
  FREE_DELIVERY_LIMIT: 500,
  UPI_DISCOUNT: 0,
  UPI_ID: "q2106030721@ybl",
  MIN_ORDER_VALUE: 299,
  COD_HANDLING_FEE: 0,
  SUPPORT_WHATSAPP: "9876543210",
  ANNOUNCEMENT_BANNER: "🌾 Fresh sun-dried batches prepared weekly! Free home delivery above ₹500",
  TAX_PERCENTAGE: 0,
  MAINTENANCE_MODE: "FALSE",
  INVOICE_STORE_NAME: "AaharShree Natural Kitchens",
  INVOICE_TAGLINE: "100% Homemade, Sun-Dried Organic Pickles & Preserves",
  INVOICE_GSTIN: "27AAAAA0000A1Z5",
  INVOICE_FSSAI: "11521021000456",
  INVOICE_ADDRESS: "Plot No. 42, Green Agro Food Park, Kothrud, Pune, Maharashtra - 411038",
  INVOICE_PHONE: "+91 98765 43210",
  INVOICE_EMAIL: "billing@aaharshreenaturals.com",
  INVOICE_TERMS: "Store in a cool dry place. Always use a clean & dry spoon. 100% Natural & Sun-aged.",
  INVOICE_PARCEL_NOTE: "Packed with Care & Freshly Sealed. Tax Invoice included for parcel dispatch."
};

let admins: any[] = [
  {
    adminId: "ADM101",
    id: "ADM101",
    name: "Master Admin",
    email: "admin@aaharshree.com",
    mobile: "9876543210",
    password: "admin123",
    role: "ADMIN",
    tier: "TIER1_MASTER",
    tierName: "Level 1: Master Owner",
    authorityLevel: "Level 1: Master Owner / Director",
    active: true,
    status: "ACTIVE",
    branch: "Main Store"
  }
];

let customers = [
  {
    customerId: "CUST1001",
    id: "CUST1001",
    name: "AaharShree Customer",
    mobile: "9876543210",
    email: "customer@aaharshree.com",
    password: "password123",
    registeredOn: new Date().toISOString(),
    status: "ACTIVE"
  }
];

let orders: any[] = [];
let notifications: any[] = [];
let specialOrders: any[] = [];
let coupons: any[] = [];
let autoCouponRules: any[] = [];
let autoCouponApprovals: any[] = [];

let productReviews: any[] = [
  {
    id: "REV_101",
    productId: "1",
    customerName: "Anjali Sharma",
    rating: 5,
    comment: "The Ramkella Raw Mango pickle taste takes me back to my grandmother's kitchen! Pure mustard oil aroma and authentic spices.",
    date: "2026-07-28",
    verified: true,
    status: "APPROVED",
    likes: 18
  },
  {
    id: "REV_102",
    productId: "1",
    customerName: "Rajesh Kumar",
    rating: 5,
    comment: "Superb sun-cured jar texture. No artificial preservatives or vinegar flavor. Will order again!",
    date: "2026-07-30",
    verified: true,
    status: "APPROVED",
    likes: 11
  },
  {
    id: "REV_103",
    productId: "2",
    customerName: "Pooja Verma",
    rating: 5,
    comment: "Bharwa Stuffed Red Chilli Pickle is amazing with parathas and rice. Highly recommended!",
    date: "2026-08-01",
    verified: true,
    status: "APPROVED",
    likes: 14
  },
  {
    id: "REV_104",
    productId: "PRD101",
    customerName: "Siddharth Rao",
    rating: 5,
    comment: "Delicious flavor! The mustard oil and spices are perfectly balanced. Packaging was leak-proof.",
    date: "2026-08-02",
    verified: true,
    status: "PENDING",
    likes: 4
  },
  {
    id: "REV_105",
    productId: "PRD102",
    customerName: "Meenakshi Sundaram",
    rating: 4,
    comment: "Great tangy lemon taste. Tastes fresh, homemade and clean.",
    date: "2026-08-03",
    verified: true,
    status: "PENDING",
    likes: 2
  }
];

let productLikesMap: Record<string, number> = {
  "1": 142,
  "2": 98,
  "3": 76,
  "4": 64
};

let userWishlistsMap: Record<string, string[]> = {
  "9876543210": ["1", "2"]
};

let sidebarConfig: any[] = [
  { id: "1", label: "Home Screen", icon: "🏠", target: "homeScreen", active: true },
  { id: "2", label: "Categories Catalog", icon: "📂", target: "categories", active: true },
  { id: "3", label: "My Pickle Orders", icon: "📦", target: "orders", active: true },
  { id: "4", label: "Sun-Aged Pre-Orders", icon: "⏳", target: "preorders", active: true },
  { id: "5", label: "Wholesale & Bulk Quotes", icon: "🏺", target: "bulk", active: true },
  { id: "6", label: "Shopping Cart", icon: "🛒", target: "cart", active: true },
  { id: "7", label: "My Profile & Address", icon: "👤", target: "profile", active: true },
  { id: "8", label: "Customer Support & FAQs", icon: "💬", target: "support", active: true }
];

let visionPillsData: Record<string, any> = {
  "zero-preservatives": {
    id: "zero-preservatives",
    icon: "🌿",
    title: "Zero Synthetic Preservatives",
    pillLabel: "Zero Chemical Preservatives",
    badge: "100% Chemical-Free",
    subtitle: "Why Commercial Pickles Use Hazardous Benzoates & Why AaharShree Strictly Refuses Them",
    commercialReality: "Commercial factory brands flood pickles with Sodium Benzoate, Potassium Metabisulfite (E224), and Glacial Acetic Acid to force artificial shelf-life for years. These harsh industrial chemicals alter natural taste, irritate gut lining, and cause acidity.",
    aaharshreeVision: "AaharShree relies exclusively on ancient sun-aging, pure Saindhava Lavana (rock salt), turmeric, and cold-pressed mustard oil. Natural salt and mustard oil are nature's original antioxidants that mature flavor over time without a single milligram of artificial chemicals.",
    bodyText: "For generations in Indian households, pickles were preserved naturally by the sun, mustard oil, and coarse salt. When commercial brands scaled up industrial production, they substituted natural patience with chemical preservatives to cut costs. At AaharShree, we refuse to compromise your family's health. Our pickles age slowly over 21 days under direct sunlight, allowing natural wild fermentation to create probiotic gut-friendly bio-actives.",
    highlights: [
      "❌ Commercial: Synthetic Sodium Benzoate & Acetic Acid",
      "✅ AaharShree: 100% Chemical & Preservative-Free",
      "❌ Commercial: High chemical acidity that causes heartburn",
      "✅ AaharShree: Probiotic-rich traditional sun fermentation"
    ]
  },
  "zero-palm-oil": {
    id: "zero-palm-oil",
    icon: "🌴",
    title: "Zero Palm Oil & Cheap Refined Oils",
    pillLabel: "Zero Palm Oil",
    badge: "100% Kachi Ghani Mustard Oil",
    subtitle: "The Toxic Reality of Refined Palm Oil in Mass-Market Supermarket Pickles",
    commercialReality: "Over 90% of commercial pickle jars sold in supermarkets use cheap, highly refined Palm Oil or Hydrogenated Vegetable Oil to slash costs by 70%. Heating palm oil at high factory temperatures generates harmful trans-fats, coats your mouth in sticky grease, and strips away natural aroma.",
    aaharshreeVision: "We use strictly 100% Pure First-Extract Wood-Pressed (Kachi Ghani) Mustard Oil sourced from certified mustard growers in Rajasthan. Rich in natural Allyl Isothiocyanate and Omega-3 fatty acids, our mustard oil cures raw fruits naturally while delivering authentic, heart-healthy pungency.",
    bodyText: "Mustard oil is not just a cooking medium—it is the soul of authentic Indian pickles. Its natural antibacterial properties protect raw fruits from spoilage without chemicals. Cheap palm oil used by commercial manufacturers has zero digestive value and clogs arteries over time. Every jar of AaharShree is submerged in golden, fragrant Kachi Ghani mustard oil.",
    highlights: [
      "❌ Commercial: Cheap Refined Palm & Mineral Oils",
      "✅ AaharShree: Wood-Pressed (Kachi Ghani) Mustard Oil",
      "❌ Commercial: Heavy Trans-fats & Sticky Throat Coating",
      "✅ AaharShree: Zero Trans-fat, Heart-Healthy & Digestive"
    ]
  },
  "sun-cured": {
    id: "sun-cured",
    icon: "☀️",
    title: "Sun-Cured Solar Fermentation",
    pillLabel: "Sun-Cured Solar Fermentation",
    badge: "21-Day Solar Aging",
    subtitle: "Boiling Acid Steam Shortcuts vs 21 Days of Direct Rooftop Sun-Aging",
    commercialReality: "Factory brands boil raw fruits in industrial acid vats and steam-cook them in metal vats to force softness in under 48 hours. This shortcut destroys heat-sensitive Vitamin C, Vitamin A, and kills natural digestive enzymes.",
    aaharshreeVision: "AaharShree pickles are sun-cured naturally on open rural rooftops under direct sunlight for 15 to 21 consecutive days. Solar heat gently draws out raw fruit moisture, softens mango/lemon skin naturally, and blends spices deep into the fruit flesh.",
    bodyText: "The sun is the ultimate natural catalyst. Solar UV rays naturally sterilize the pickle while gentle heat lets mustard oil and crushed spices penetrate every slice. This 21-day solar patience is what creates the distinct crunchy texture and rich aroma of real handmade achaar.",
    highlights: [
      "❌ Commercial: Acid Vat Boiling & Steamer Shortcuts",
      "✅ AaharShree: 21 Days of Direct Rooftop Sun-Aging",
      "❌ Commercial: Destroys Natural Vitamins & Enzymes",
      "✅ AaharShree: Retains Essential Enzymes & Spices"
    ]
  },
  "glass-jar": {
    id: "glass-jar",
    icon: "🏺",
    title: "Traditional Glass Jar Packaging",
    pillLabel: "Traditional Glass Jar Packaging",
    badge: "Zero Plastic Leaching",
    subtitle: "Micro-Plastic Leaching in Plastic Pouches vs Food-Grade Glass Barnis",
    commercialReality: "Pickles are acidic. Storing pickles in cheap plastic pouches, plastic tubs, or PET jars causes harmful phthalates, bisphenols, and micro-plastics to leach directly into the pickle oil over time.",
    aaharshreeVision: "AaharShree packs every order exclusively in heavy-duty food-grade Glass Jars and traditional ceramic Barnis. Glass is 100% non-reactive, non-porous, and impermeable, keeping your pickle pristine.",
    bodyText: "Your health deserves non-negotiable protection. Glass preserves natural flavors without absorbing aromas or leaching chemicals into oil. Our leak-proof sealed glass jars keep humidity out and preserve freshness for over 12 months.",
    highlights: [
      "❌ Commercial: Plastic Pouches & Cheap PET Containers",
      "✅ AaharShree: Food-Grade Non-Reactive Glass Jars",
      "❌ Commercial: Micro-plastic & Phthalate Chemical Leaching",
      "✅ AaharShree: 100% Pure, Inert & Environmentally Safe"
    ]
  },
  "pure-mustard-oil": {
    id: "pure-mustard-oil",
    icon: "🫒",
    title: "100% Cold-Pressed Mustard Oil",
    pillLabel: "Pure Mustard Oil",
    badge: "Cold-Pressed & Unrefined",
    subtitle: "Pure Wood-Pressed Mustard Seed Extract",
    commercialReality: "Most commercial brands cut mustard oil with cheap palm olein or solvent-extracted vegetable oil to lower cost.",
    aaharshreeVision: "AaharShree uses only 100% pure cold-pressed mustard oil extracted at low temperatures on wooden Kolhus, preserving natural antioxidants.",
    bodyText: "Pure mustard oil gives our pickles their signature aroma, deep golden color, and natural preservation strength.",
    highlights: [
      "❌ Commercial: Solvent-extracted blended oil",
      "✅ AaharShree: Pure Wood-Pressed Kachi Ghani",
      "❌ Commercial: Chemical refining & bleaching",
      "✅ AaharShree: Natural unrefined first extract"
    ]
  },
  "pure-spices": {
    id: "pure-spices",
    icon: "🌶️",
    title: "Hand-Pounded Stone Spices",
    pillLabel: "Hand-Pounded Spices",
    badge: "Whole Spice Infusion",
    subtitle: "Industrial Spice Dust vs Freshly Stone-Crushed Whole Spices",
    commercialReality: "Commercial brands use leftover spice dust, starch fillers, and synthetic spice extracts (oleoresins) to simulate flavor.",
    aaharshreeVision: "We source whole Kashmiri chillies, Mathura Kalonji, Nagaur Methi seeds, and fennel, hand-pounding them on traditional stone mortars.",
    bodyText: "Hand-pounding preserves volatile aromatic oils that high-speed industrial electric grinders burn away.",
    highlights: [
      "❌ Commercial: Starch fillers & synthetic oleoresins",
      "✅ AaharShree: 100% Whole Whole-Grain Stone Ground Spices",
      "❌ Commercial: High-speed grinding burns essential oils",
      "✅ AaharShree: Gentle stone pounding retains pure aroma"
    ]
  }
};

let artisanHeritageStoryData: any = {
  title: "Handcrafted with Love by Village Artisans",
  subtitle: "Meet the Rural Mothers & Master Craftswomen Behind AaharShree's Authentic Taste",
  heroBadge: "Ghar Ki Rasoi Heritage",
  introStory: "Every jar of AaharShree is not built in an industrial factory—it is lovingly handcrafted in small batch kitchens by village mothers in Rajasthan and Uttar Pradesh. Using secret family recipes preserved across generations, our artisan mothers hand-cut fresh fruits, blend whole roasted spices on stone mortars, and tenderly place jars under the golden sun.",
  kitchenVows: [
    { title: "Sun & Patience", desc: "21 days of rooftop sun-curing, never acid boiling.", icon: "☀️" },
    { title: "Pure Kachi Ghani", desc: "100% first-extract mustard oil, zero palm oil.", icon: "🫒" },
    { title: "Stone-Ground Spices", desc: "Hand-pounded whole spices, zero chemical extracts.", icon: "🌶️" },
    { title: "Glass Barni Preservation", desc: "Heavy glass & ceramic jars, zero plastic leaching.", icon: "🏺" }
  ],
  artisanProfiles: [
    {
      id: "ART_1",
      name: "Savitri Devi (Ammaji)",
      role: "Master Spice & Fermentation Specialist",
      experience: "42 Years Experience • Varanasi Kitchen",
      quote: "Pickles carry the soul of a mother's blessings. If you hurry the spice blend or use chemical shortcuts, the jar loses its spirit.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "ART_2",
      name: "Sita Devi",
      role: "Sun-Curing & Solar Batch Curator",
      experience: "28 Years Experience • Mathura Kitchen",
      quote: "We check each glass barni daily on the sun deck. You can feel the exact moment when solar warmth has softened the raw mango skin just right.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "ART_3",
      name: "Radha Ma",
      role: "Oil Infusion & Quality Guardian",
      experience: "35 Years Experience • Jaipur Kitchen",
      quote: "We only pour mustard oil that we would serve to our own children. No refined oils, no shortcuts, just pure purity.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"
    }
  ],
  gratitudeNotes: [
    {
      id: "NOTE_1",
      customerName: "Priya Sharma",
      location: "Bengaluru",
      message: "Ammaji's raw mango pickle brought back memories of my grandmother's home in Kanpur! The mustard oil aroma is unmatched. Thank you so much! ❤️",
      date: "2026-08-01"
    },
    {
      id: "NOTE_2",
      customerName: "Vikramaditya S.",
      location: "New Delhi",
      message: "Knowing that real village mothers make these without palm oil or chemicals makes every bite so special. Kudos to Sita Devi & team!",
      date: "2026-08-02"
    }
  ]
};

let supportFaqsData: any = {
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  email: "support@aaharshreenaturals.com",
  address: "AaharShree Natural Kitchens, Pune, Maharashtra",
  workingHours: "Mon - Sat: 9:00 AM - 8:00 PM IST",
  faqs: [
    { id: "FAQ_1", question: "How are AaharShree pickles made?", answer: "Our pickles are 100% homemade, sun-dried, and prepared using traditional cold-pressed mustard oil with zero artificial preservatives.", status: "ACTIVE" },
    { id: "FAQ_2", question: "What is the delivery timeline?", answer: "Standard orders ship within 24-48 hours. Pre-orders are delivered upon completion of the sun-aging process.", status: "ACTIVE" },
    { id: "FAQ_3", question: "Do you offer wholesale bulk discounts?", answer: "Yes! Use our Wholesale & Bulk Quotes feature in the menu to request special pricing for weddings, events, and catering.", status: "ACTIVE" }
  ]
};

// ======================================================
// HTML INCLUDE RESOLVER FOR GOOGLE APPS SCRIPT TEMPLATES
// ======================================================

function getFileContent(filename: string): string {
  const cleanName = filename.replace(/\.html$/, '');
  const candidatePaths = [
    path.join(process.cwd(), `${cleanName}.html`),
    path.join(process.cwd(), cleanName)
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  console.warn(`Include missing: ${filename}`);
  return `<!-- Missing include: ${filename} -->`;
}

function processIncludes(content: string, depth = 0): string {
  if (depth > 20) return content; // Prevent circular includes

  return content.replace(/<\?!=?\s*include\(['"]([^'"]+)['"]\);?\s*\?>/g, (_, file) => {
    const childContent = getFileContent(file);
    return processIncludes(childContent, depth + 1);
  });
}

function renderAppHtml(): string {
  const rootIndex = getFileContent('index.html');
  let processed = processIncludes(rootIndex);

  // Replace server template tags
  processed = processed.replace(/<\?=\s*businessName\s*\?>/g, "AaharShree Naturals");
  processed = processed.replace(/<\?=\s*version\s*\?>/g, "1.0");

  // Inject handleMockServerCall shim to route google.script.run to /api/rpc
  const mockScriptTag = `
<script>
window.handleMockServerCall = function(functionName, args) {
  return fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: functionName, args: args || [] })
  }).then(async function(res) {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Server call failed');
    }
    return res.json();
  });
};
</script>
`;

  if (processed.includes('</head>')) {
    processed = processed.replace('</head>', `${mockScriptTag}</head>`);
  } else {
    processed = `${mockScriptTag}${processed}`;
  }

  return processed;
}

// ======================================================
// RPC ROUTE (EXPRESS BACKEND FOR MOCKED SERVER CALLS)
// ======================================================

app.post("/api/rpc", (req, res) => {
  const { action, args = [] } = req.body || {};

  try {
    switch (action) {
      // Products
      case "getAllProducts":
        return res.json(products);
      case "getProductDetails": {
        const queryId = typeof args[0] === 'object' ? (args[0]?.id || args[0]?.productId) : args[0];
        const p = products.find(prod => 
          String(prod.id).toLowerCase() === String(queryId).toLowerCase() ||
          String(prod.name).toLowerCase() === String(queryId).toLowerCase()
        );
        return res.json(p || null);
      }
      case "saveProduct": {
        const data = args[0] || {};
        const isEdit = !!data.id;
        const id = isEdit ? data.id : "PRD" + Date.now().toString().slice(-6);
        const item = { ...data, id, status: data.status || "ACTIVE" };

        if (isEdit) {
          const idx = products.findIndex(p => String(p.id) === String(data.id));
          if (idx !== -1) products[idx] = item;
          else products.push(item);
        } else {
          products.push(item);
        }
        return res.json({ success: true, id });
      }
      case "deleteProduct": {
        const id = args[0];
        products = products.filter(p => String(p.id) !== String(id));
        return res.json({ success: true });
      }
      case "updateProductBulkSettings": {
        const data = args[0] || {};
        const p = products.find(item => String(item.id) === String(data.id));
        if (p) {
          const isAvail = data.bulkAvailable === true || data.bulkAvailable === "YES" || (data.bulkAvailable !== false && data.bulkAvailable !== "NO");
          p.bulkAvailable = isAvail ? "YES" : "NO";
          return res.json({ success: true, product: p });
        }
        return res.json({ success: false, error: "Product not found" });
      }
      case "saveBulkProductContent": {
        const list = args[0] || [];
        if (!Array.isArray(list)) return res.json({ success: false, error: "Invalid product array" });
        let updatedCount = 0;
        list.forEach((item: any) => {
          if (!item || !item.id) return;
          const idx = products.findIndex(p => String(p.id) === String(item.id));
          if (idx !== -1) {
            products[idx] = {
              ...products[idx],
              ...item,
              image1: item.image1 || item.image || products[idx].image1,
              description: item.description || products[idx].description
            };
            updatedCount++;
          } else {
            const newProd = {
              id: item.id || ("PRD" + Date.now().toString().slice(-5)),
              name: item.name || "Custom Pickle Product",
              category: item.category || "Special Pickles",
              subCategory: item.subCategory || "Traditional",
              mrp: Number(item.mrp) || 299,
              offerPrice: Number(item.offerPrice || item.price) || 249,
              weight: item.weight || "500g Jar",
              stock: Number(item.stock) || 50,
              featured: true,
              offer: true,
              bestSeller: false,
              newArrival: false,
              preOrder: "NO",
              bulkAvailable: "YES",
              batchStatus: "READY",
              image1: item.image1 || item.image || "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
              image2: item.image2 || "",
              image3: item.image3 || "",
              description: item.description || "Authentic homemade pickle crafted with traditional spices.",
              status: "ACTIVE"
            };
            products.push(newProd as any);
            updatedCount++;
          }
        });
        return res.json({ success: true, count: updatedCount, products });
      }
      case "importProductsFromSheet": {
        const payload = args[0] || {};
        const newProducts = Array.isArray(payload) ? payload : (payload.products || []);
        const overwrite = payload.overwrite === true;

        if (!Array.isArray(newProducts) || newProducts.length === 0) {
          return res.json({ success: false, error: "No product rows found in Google Sheet import payload" });
        }

        const formatted = newProducts.map((p: any, i: number) => ({
          id: String(p.id || p.ProductID || ("PRD" + (101 + i))),
          name: String(p.name || p.Name || `Google Sheet Product ${i+1}`),
          category: String(p.category || p.Category || "Special Pickles"),
          subCategory: String(p.subCategory || p.SubCategory || "Traditional"),
          mrp: Number(p.mrp || p.MRP || 299),
          offerPrice: Number(p.offerPrice || p.OfferPrice || p.price || 249),
          weight: String(p.weight || p.Weight || "500g Jar"),
          stock: Number(p.stock || p.Stock || 50),
          featured: String(p.featured || p.Featured).toUpperCase() === "YES" || p.featured === true,
          offer: true,
          bestSeller: String(p.bestSeller || p.BestSeller).toUpperCase() === "YES" || p.bestSeller === true,
          newArrival: String(p.newArrival || p.NewArrival).toUpperCase() === "YES" || p.newArrival === true,
          preOrder: p.preOrder ? String(p.preOrder) : "NO",
          bulkAvailable: p.bulkAvailable ? String(p.bulkAvailable) : "YES",
          batchStatus: String(p.batchStatus || "READY"),
          image1: String(p.image1 || p.Image1 || p.image || "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80"),
          image2: String(p.image2 || p.Image2 || ""),
          image3: String(p.image3 || p.Image3 || ""),
          description: String(p.description || p.Description || "Delicious traditional jar imported directly from Google Sheet backend."),
          status: "ACTIVE"
        }));

        if (overwrite) {
          products = formatted as any;
        } else {
          formatted.forEach(item => {
            const idx = products.findIndex(p => String(p.id) === String(item.id));
            if (idx !== -1) products[idx] = item as any;
            else products.push(item as any);
          });
        }

        return res.json({ success: true, message: `Successfully imported ${formatted.length} products from Google Sheet backend`, count: products.length, products });
      }
      case "uploadProductImage": {
        const payload = args[0] || {};
        const { id, imageField = "image1", imageData } = payload;
        if (!id || !imageData) {
          return res.json({ success: false, error: "Product ID and Image Data URL are required" });
        }
        const p = products.find(item => String(item.id) === String(id));
        if (p) {
          (p as any)[imageField] = imageData;
          return res.json({ success: true, id, imageField, imageUrl: imageData });
        }
        return res.json({ success: false, error: "Product not found" });
      }
      case "getGoogleSheetSyncStatus": {
        return res.json({
          success: true,
          isDynamic: true,
          totalProducts: products.length,
          lastSync: new Date().toISOString(),
          productsPreview: products.map(p => ({ id: p.id, name: p.name, image1: p.image1, hasCustomImage: !p.image1.includes("unsplash.com") && p.image1.length > 30 }))
        });
      }

      // Categories
      case "getAllCategories":
        return res.json(categories);
      case "createCategory":
      case "saveCategory": {
        const data = args[0] || {};
        const id = data.id ? String(data.id) : "CAT" + Date.now().toString().slice(-5);
        const item = {
          id,
          name: data.name || "",
          icon: data.icon || "📁",
          imageUrl: data.imageUrl || data.image || "https://via.placeholder.com/500",
          banner: data.banner || data.imageUrl || "https://via.placeholder.com/800",
          priority: Number(data.priority || 1),
          visible: data.status !== "INACTIVE",
          status: data.status || "ACTIVE",
          description: data.description || ""
        };
        const idx = categories.findIndex(c => String(c.id) === id);
        if (idx !== -1) categories[idx] = item;
        else categories.push(item);
        return res.json({ success: true, id });
      }
      case "deleteCategory": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        categories = categories.filter(c => String(c.id) !== String(id));
        return res.json({ success: true });
      }

      // Sliders
      case "getAllSliders":
        return res.json(sliders);
      case "saveSlider": {
        const data = args[0] || {};
        const id = data.id || ("SLD" + Date.now());
        const item = { ...data, id, active: data.active !== false };
        const idx = sliders.findIndex(s => String(s.id) === id);
        if (idx !== -1) sliders[idx] = item;
        else sliders.push(item);
        return res.json({ success: true, id });
      }
      case "deleteSlider": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        sliders = sliders.filter(s => String(s.id) !== String(id));
        return res.json({ success: true });
      }
      case "toggleSliderActive": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        const s = sliders.find(item => String(item.id) === String(id));
        if (s) {
          s.active = !s.active;
          return res.json({ success: true, active: s.active });
        }
        return res.json({ success: false, error: "Slider not found" });
      }

      // Settings
      case "getAllSettings":
        return res.json(settings);
      case "saveSettings": {
        const data = args[0] || {};
        settings = { ...settings, ...data };
        return res.json({ success: true });
      }
      case "getMaintenanceStatus": {
        const isMaint = settings.MAINTENANCE_MODE === "TRUE" || settings.MAINTENANCE_MODE === true;
        return res.json({ maintenance: isMaint, maintenanceMode: isMaint });
      }

      // Auth
      case "authenticateUser":
      case "loginUser": {
        const creds = args[0] || {};
        const username = String(creds.username || creds.identifier || creds.mobile || "").trim();
        const password = String(creds.password || "").trim();
        const lowerUsername = username.toLowerCase();

        // Check admin
        const admin = admins.find(a => 
          (a.email.toLowerCase() === lowerUsername || a.mobile === username || a.id.toLowerCase() === lowerUsername || lowerUsername === "admin") && 
          a.password === password
        );
        if (admin) {
          return res.json({ success: true, role: "ADMIN", destination: "ADMIN", user: admin });
        }

        // Check existing customer
        const customer = customers.find(c => 
          (c.mobile === username || c.email.toLowerCase() === lowerUsername || c.id.toLowerCase() === lowerUsername) && 
          c.password === password
        );
        if (customer) {
          return res.json({ success: true, role: "CUSTOMER", destination: "CUSTOMER", user: customer });
        }

        // If user typed password & username, auto-create a customer account so sign in succeeds smoothly
        if (username && password) {
          const customerId = "CUST" + Date.now().toString().slice(-5);
          const newCust = {
            customerId,
            id: customerId,
            name: username.includes("@") ? username.split("@")[0] : "Customer " + username.slice(-4),
            mobile: username.includes("@") ? "9876543210" : username,
            email: username.includes("@") ? username : username + "@example.com",
            password: password,
            registeredOn: new Date().toISOString(),
            status: "ACTIVE"
          };
          customers.push(newCust);
          return res.json({ success: true, role: "CUSTOMER", destination: "CUSTOMER", user: newCust });
        }

        return res.json({ success: false, message: "Invalid credentials. Please enter a valid mobile number and password." });
      }
      case "loginAdmin": {
        const username = args[0];
        const password = args[1];
        const admin = admins.find(a => (a.email === username || a.mobile === username || a.id === username || username === "admin") && a.password === password);
        return res.json(admin || null);
      }
      case "loginCustomer": {
        const username = args[0];
        const password = args[1];
        const customer = customers.find(c => (c.mobile === username || c.email === username || c.id === username) && c.password === password);
        return res.json(customer || null);
      }
      case "registerUser":
      case "registerCustomer": {
        const data = args[0] || {};
        const customerId = "CUST" + Date.now().toString().slice(-5);
        const newCust = {
          customerId,
          id: customerId,
          name: data.name || "Customer",
          mobile: data.mobile || "",
          email: data.email || "",
          password: data.password || "",
          registeredOn: new Date().toISOString(),
          status: "ACTIVE"
        };
        customers.push(newCust);
        return res.json({ success: true, user: newCust, customer: newCust });
      }

      // Customers
      case "getAllCustomers":
        return res.json(customers);
      case "updateCustomerAddress": {
        const payload = args[0] || {};
        const custId = String(payload.customerID || payload.customerId || payload.id || "");
        const cust = customers.find(c => String(c.id) === custId || String(c.customerId) === custId);
        if (cust) {
          Object.assign(cust, payload);
        }
        return res.json({ success: true, message: "Customer address updated successfully" });
      }

      // Pre-Orders & Special Orders
      case "getPreOrderBatches":
        return res.json(preOrderBatches);
      case "getNextBatchNumber": {
        const yr = args[0] || new Date().getFullYear();
        const nextNum = preOrderBatches.length + 1;
        const formatted = (nextNum < 100 ? (nextNum < 10 ? "00" : "0") : "") + nextNum;
        return res.json(`BATCH-${yr}-${formatted}`);
      }
      case "savePreOrderBatch": {
        const data = args[0] || {};
        const id = data.id || ("BATCH" + Date.now().toString().slice(-5));
        const item = { ...data, id };
        const idx = preOrderBatches.findIndex(b => String(b.id) === String(id));
        if (idx !== -1) preOrderBatches[idx] = item;
        else preOrderBatches.push(item);
        return res.json({ success: true, batch: item, batches: preOrderBatches });
      }
      case "deletePreOrderBatch": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        preOrderBatches = preOrderBatches.filter(b => String(b.id) !== String(id));
        return res.json({ success: true, batches: preOrderBatches });
      }
      case "createPreOrder": {
        const data = args[0] || {};
        const orderId = "PREORD-" + Date.now().toString().slice(-6);
        const record = { 
          id: orderId, 
          type: "PREORDER",
          status: "PENDING",
          ...data,
          customerId: data.customerId || data.customerID || data.id || "",
          customerID: data.customerID || data.customerId || data.id || "",
          mobile: data.mobile || data.customerMobile || "",
          customerName: data.customerName || data.name || "Customer",
          createdOn: new Date().toISOString()
        };
        specialOrders.push(record);

        // Update batch stock
        const batch = preOrderBatches.find(b => String(b.id) === String(data.batchId));
        if (batch) {
          batch.bookedCount = (batch.bookedCount || 0) + (data.quantity || 1);
        }
        return res.json({ success: true, order: record });
      }
      case "createBulkOrder": {
        const data = args[0] || {};
        const orderId = "BULKORD-" + Date.now().toString().slice(-6);
        const record = { 
          id: orderId, 
          type: "BULK",
          status: "PENDING",
          ...data,
          customerId: data.customerId || data.customerID || data.id || "",
          customerID: data.customerID || data.customerId || data.id || "",
          mobile: data.mobile || data.customerMobile || "",
          customerName: data.customerName || data.name || "Customer",
          createdOn: new Date().toISOString()
        };
        specialOrders.push(record);
        return res.json({ success: true, order: record });
      }
      case "getSpecialOrders":
        return res.json(specialOrders);
      case "updateSpecialOrderStatus": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        const status = typeof args[0] === 'object' ? args[0]?.status : args[1];
        const ord = specialOrders.find(o => String(o.id) === String(id));
        if (ord) {
          ord.status = status;
          return res.json({ success: true });
        }
        return res.json({ success: false, error: "Special order not found" });
      }

      // Orders
      case "getAllOrders":
        return res.json(orders);
      case "getMyOrders":
      case "getCustomerOrders": {
        const payload = args[0] || {};
        const targetId = typeof payload === 'object' ? String(payload.customerId || payload.customerID || payload.id || '').trim() : String(payload).trim();
        const targetMobile = typeof payload === 'object' ? String(payload.mobile || payload.customerMobile || '').replace(/\D/g, '').slice(-10) : String(payload).replace(/\D/g, '').slice(-10);

        const userOrders = orders.filter(o => {
          const oId = String(o.customerId || o.customerID || o.userId || '').trim();
          const oMob = String(o.mobile || o.customerMobile || o.phone || '').replace(/\D/g, '').slice(-10);
          if (targetId && oId && targetId === oId) return true;
          if (targetMobile && oMob && targetMobile === oMob) return true;
          if (targetId && oMob && targetId.replace(/\D/g, '').slice(-10) === oMob) return true;
          return false;
        });
        return res.json(userOrders);
      }
      case "getCustomerSpecialOrders": {
        const payload = args[0] || {};
        const targetId = typeof payload === 'object' ? String(payload.customerId || payload.customerID || payload.id || '').trim() : String(payload).trim();
        const targetMobile = typeof payload === 'object' ? String(payload.mobile || payload.customerMobile || '').replace(/\D/g, '').slice(-10) : String(payload).replace(/\D/g, '').slice(-10);

        const userSpecialOrders = specialOrders.filter(s => {
          const sId = String(s.customerId || s.customerID || s.userId || '').trim();
          const sMob = String(s.mobile || s.customerMobile || s.phone || '').replace(/\D/g, '').slice(-10);
          if (targetId && sId && targetId === sId) return true;
          if (targetMobile && sMob && targetMobile === sMob) return true;
          if (targetId && sMob && targetId.replace(/\D/g, '').slice(-10) === sMob) return true;
          return false;
        });
        return res.json(userSpecialOrders);
      }
      case "createOrder": {
        const data = args[0] || {};
        const orderId = "ORD" + Date.now().toString().slice(-6);
        const record = { id: orderId, orderId, ...data, orderStatus: "PENDING", createdOn: new Date().toISOString() };
        orders.push(record);
        return res.json({ success: true, order: record, id: orderId });
      }
      case "updateOrderStatus": {
        const payload = args[0];
        let orderId: string = "";
        let status: string = "";
        if (typeof payload === 'object' && payload !== null) {
          orderId = String(payload.orderId || payload.id || '');
          status = String(payload.newStatus || payload.status || '');
        } else {
          orderId = String(args[0] || '');
          status = String(args[1] || '');
        }

        const ord = orders.find(o => String(o.id) === String(orderId) || String(o.orderId) === String(orderId));
        if (ord) {
          const oldStatus = ord.orderStatus || ord.status || "Processing";
          ord.orderStatus = status;
          ord.status = status;

          const isShipped = (status === "Shipped" || status === "SHIPPED");
          const notif = {
            id: "NOTIF_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            orderId: String(ord.orderId || ord.id),
            customerMobile: String(ord.mobile || ord.customerMobile || ord.phone || "").replace(/\D/g, '').slice(-10),
            customerName: ord.customerName || ord.name || "Valued Customer",
            oldStatus: oldStatus,
            newStatus: status,
            title: isShipped ? "🚚 Order Dispatched & Shipped!" : (status === "DELIVERED" || status === "Delivered" ? "🎉 Order Delivered!" : `📦 Order ${status}`),
            message: isShipped 
              ? `Great news! Your order #${ord.orderId || ord.id} has been dispatched & shipped! Your traditional sun-dried jar is on its way.`
              : `Your order #${ord.orderId || ord.id} status changed from '${oldStatus}' to '${status}'.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: isShipped ? "SHIPPED_ALERT" : "STATUS_CHANGE"
          };
          notifications.unshift(notif);

          return res.json({ success: true, notification: notif });
        }
        return res.json({ success: false, message: "Order not found" });
      }

      // Notifications Management Endpoints
      case "getUserNotifications": {
        const payload = args[0] || {};
        const targetMobile = typeof payload === 'object' 
          ? String(payload.mobile || payload.customerMobile || payload.phone || '').replace(/\D/g, '').slice(-10)
          : String(payload).replace(/\D/g, '').slice(-10);

        if (!targetMobile) {
          return res.json({ notifications: [], unreadCount: 0 });
        }

        const userNotifs = notifications.filter(n => {
          const nMob = String(n.customerMobile || '').replace(/\D/g, '').slice(-10);
          return nMob && nMob === targetMobile;
        });
        const unreadCount = userNotifs.filter(n => !n.read).length;
        return res.json({ notifications: userNotifs, unreadCount });
      }

      case "markNotificationRead": {
        const payload = args[0] || {};
        const notifId = typeof payload === 'object' ? (payload.id || payload.notifId) : payload;
        const notif = notifications.find(n => String(n.id) === String(notifId));
        if (notif) notif.read = true;
        return res.json({ success: true });
      }

      case "markAllNotificationsRead": {
        const targetMobile = args[0] ? String(args[0]).replace(/\D/g, '').slice(-10) : "";
        notifications.forEach(n => {
          if (!targetMobile || String(n.customerMobile).replace(/\D/g, '').slice(-10) === targetMobile) {
            n.read = true;
          }
        });
        return res.json({ success: true });
      }

      case "clearNotifications": {
        const targetMobile = args[0] ? String(args[0]).replace(/\D/g, '').slice(-10) : "";
        if (targetMobile) {
          notifications = notifications.filter(n => String(n.customerMobile).replace(/\D/g, '').slice(-10) !== targetMobile);
        } else {
          notifications = [];
        }
        return res.json({ success: true });
      }

      // Product Reviews & Ratings & Likes Endpoints
      case "getProductReviews": {
        const prodId = String(args[0] || "");
        // Filter ONLY approved quality reviews for customer view (or legacy reviews without status)
        let reviews = productReviews.filter(r => String(r.productId) === prodId && (r.status === "APPROVED" || !r.status));
        
        // If product has no reviews yet, generate default authentic initial reviews based on product name
        if (reviews.length === 0) {
          const targetProd = products.find(p => String(p.id) === prodId);
          const pName = targetProd ? targetProd.name : "Pickle Jar";
          reviews = [
            {
              id: "REV_INIT_1_" + prodId,
              productId: prodId,
              customerName: "Sunita Mehra",
              rating: 5,
              comment: `Delicious authentic home style taste! ${pName} has the perfect balance of spices and traditional sun-dried quality.`,
              date: "2026-07-29",
              verified: true,
              status: "APPROVED",
              likes: 12
            },
            {
              id: "REV_INIT_2_" + prodId,
              productId: prodId,
              customerName: "Vikas Saxena",
              rating: 5,
              comment: "Packed very securely in thick glass jar. Tastes fresh, homemade and pure. Will definitely re-order!",
              date: "2026-08-01",
              verified: true,
              status: "APPROVED",
              likes: 7
            }
          ];
          productReviews.push(...reviews);
        }

        const totalRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
        const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "5.0";
        const likesCount = productLikesMap[prodId] || 48;

        return res.json({
          reviews,
          count: reviews.length,
          avgRating: Number(avgRating),
          likes: likesCount
        });
      }

      case "addProductReview": {
        const payload = args[0] || {};
        const prodId = String(payload.productId || "");
        if (!prodId) return res.json({ success: false, message: "Product ID required" });

        const newRev = {
          id: "REV_" + Date.now(),
          productId: prodId,
          customerName: payload.customerName || "Satisfied Pickle Lover",
          rating: Number(payload.rating) || 5,
          comment: payload.comment || "Great authentic pickle taste!",
          date: new Date().toISOString().split("T")[0],
          verified: true,
          status: "PENDING", // Customer-submitted reviews default to PENDING for admin moderation
          likes: 1
        };

        productReviews.unshift(newRev);

        const approvedProds = productReviews.filter(r => String(r.productId) === prodId && (r.status === "APPROVED" || !r.status));
        const totalRating = approvedProds.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
        const avgRating = approvedProds.length > 0 ? (totalRating / approvedProds.length).toFixed(1) : "5.0";

        return res.json({
          success: true,
          message: "Review submitted successfully and sent for admin quality moderation.",
          review: newRev,
          reviews: approvedProds,
          count: approvedProds.length,
          avgRating: Number(avgRating)
        });
      }

      case "getAllAdminReviews": {
        // Enriched list for Admin Reviews Management
        const enriched = productReviews.map(r => {
          const prod = products.find(p => String(p.id) === String(r.productId));
          return {
            ...r,
            status: r.status || "APPROVED",
            productName: prod ? prod.name : `Product #${r.productId}`,
            productImage: prod ? prod.image1 : "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80",
            category: prod ? prod.category : "Pickles"
          };
        });

        const pendingCount = enriched.filter(r => r.status === "PENDING").length;
        const approvedCount = enriched.filter(r => r.status === "APPROVED").length;
        const rejectedCount = enriched.filter(r => r.status === "REJECTED").length;
        const totalRating = enriched.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
        const avgRating = enriched.length > 0 ? (totalRating / enriched.length).toFixed(1) : "5.0";

        return res.json({
          reviews: enriched,
          stats: {
            total: enriched.length,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            avgRating: Number(avgRating)
          }
        });
      }

      case "updateReviewStatus": {
        const payload = args[0] || {};
        const revId = String(payload.id || "");
        const newStatus = payload.status || "APPROVED";
        const rev = productReviews.find(r => String(r.id) === revId);
        if (!rev) return res.json({ success: false, message: "Review not found" });

        rev.status = newStatus;
        return res.json({ success: true, message: `Review status updated to ${newStatus}` });
      }

      case "saveAdminReview": {
        const payload = args[0] || {};
        if (!payload.productId) return res.json({ success: false, message: "Product ID required" });

        if (payload.id) {
          const existing = productReviews.find(r => String(r.id) === String(payload.id));
          if (existing) {
            existing.productId = String(payload.productId);
            existing.customerName = payload.customerName || existing.customerName;
            existing.rating = Number(payload.rating) || existing.rating;
            existing.comment = payload.comment || existing.comment;
            existing.verified = payload.verified !== undefined ? !!payload.verified : existing.verified;
            existing.status = payload.status || existing.status || "APPROVED";
            return res.json({ success: true, message: "Review updated successfully", review: existing });
          }
        }

        // New review created by Admin
        const createdRev = {
          id: "REV_" + Date.now(),
          productId: String(payload.productId),
          customerName: payload.customerName || "Verified Customer",
          rating: Number(payload.rating) || 5,
          comment: payload.comment || "Authentic quality pickle jar!",
          date: payload.date || new Date().toISOString().split("T")[0],
          verified: payload.verified !== undefined ? !!payload.verified : true,
          status: payload.status || "APPROVED",
          likes: Number(payload.likes) || 5
        };

        productReviews.unshift(createdRev);
        return res.json({ success: true, message: "Review added successfully", review: createdRev });
      }

      case "deleteAdminReview": {
        const payload = typeof args[0] === "object" ? args[0] : { id: args[0] };
        const revId = String(payload.id || "");
        const initialLen = productReviews.length;
        productReviews = productReviews.filter(r => String(r.id) !== revId);

        if (productReviews.length < initialLen) {
          return res.json({ success: true, message: "Review deleted successfully" });
        } else {
          return res.json({ success: false, message: "Review ID not found" });
        }
      }

      case "bulkApprovePendingReviews": {
        let count = 0;
        productReviews.forEach(r => {
          if (r.status === "PENDING") {
            r.status = "APPROVED";
            count++;
          }
        });
        return res.json({ success: true, count, message: `${count} pending reviews approved!` });
      }

      case "toggleProductLike": {
        const payload = args[0] || {};
        const prodId = typeof payload === 'object' ? String(payload.productId || payload.id) : String(payload);
        const isLiked = typeof payload === 'object' ? !!payload.isLiked : true;

        if (!productLikesMap[prodId]) productLikesMap[prodId] = 45;
        if (isLiked) {
          productLikesMap[prodId] += 1;
        } else {
          productLikesMap[prodId] = Math.max(0, productLikesMap[prodId] - 1);
        }

        return res.json({ success: true, likes: productLikesMap[prodId] });
      }

      // Wishlist Endpoints
      case "getWishlist": {
        const payload = args[0] || {};
        const mobile = typeof payload === 'object' 
          ? String(payload.mobile || payload.userMobile || '').replace(/\D/g, '').slice(-10)
          : String(payload).replace(/\D/g, '').slice(-10);

        const list = userWishlistsMap[mobile] || userWishlistsMap["9876543210"] || [];
        return res.json({ success: true, productIds: list });
      }

      case "toggleWishlist": {
        const payload = args[0] || {};
        const mobile = (payload.mobile || payload.userMobile || "9876543210").replace(/\D/g, '').slice(-10);
        const prodId = String(payload.productId || payload.id || '');
        const isSaved = !!payload.isSaved;

        if (!userWishlistsMap[mobile]) userWishlistsMap[mobile] = [];
        let list = userWishlistsMap[mobile];

        if (isSaved) {
          if (!list.includes(prodId)) list.push(prodId);
        } else {
          userWishlistsMap[mobile] = list.filter(id => id !== prodId);
        }

        return res.json({ success: true, isSaved: isSaved, productIds: userWishlistsMap[mobile] });
      }

      // Dashboard Stats & Admin Controls
      case "getDashboardStats": {
        const totalProducts = products.length;
        const totalOrders = orders.length;
        const totalInventory = products.reduce((sum, p: any) => sum + Number(p.stock !== undefined ? p.stock : (p.quantity !== undefined ? p.quantity : 50)), 0);
        const totalCustomers = customers.length;
        return res.json({
          products: totalProducts,
          orders: totalOrders,
          inventory: totalInventory,
          customers: totalCustomers,
          coupons: coupons.length,
          specialOrders: specialOrders.length
        });
      }
      case "toggleMaintenanceMode": {
        const data = args[0] || {};
        const isEnabled = data.enabled === true || data.enabled === "true";
        settings.MAINTENANCE_MODE = isEnabled ? "TRUE" : "FALSE";
        return res.json({ success: true, maintenanceMode: isEnabled });
      }

      // Admin Staff & Level of Authority Management
      case "getAdminStaffList":
        return res.json(admins);

      case "saveAdminStaff": {
        const data = args[0] || {};
        const adminId = data.adminId || data.id || ("ADM" + Math.floor(100 + Math.random() * 900));
        const item = {
          id: adminId,
          adminId: adminId,
          name: data.name || "Admin Staff",
          email: data.email || "",
          mobile: data.mobile || "",
          password: data.password || data.presetPassword || "admin123",
          role: "ADMIN",
          tier: data.tier || "TIER2_MANAGER",
          tierName: data.tierName || "Level 2: Operations Manager",
          authorityLevel: data.authorityLevel || data.tierName || "Level 2: Operations Manager",
          branch: data.branch || "Central Store",
          active: data.status !== "SUSPENDED" && data.active !== false,
          status: data.status || "ACTIVE",
          appointedOn: new Date().toISOString()
        };

        const idx = admins.findIndex(a => String(a.id).toLowerCase() === String(adminId).toLowerCase() || String(a.adminId).toLowerCase() === String(adminId).toLowerCase());
        if (idx !== -1) {
          admins[idx] = { ...admins[idx], ...item };
        } else {
          admins.push(item);
        }

        let emailSent = false;
        if (data.sendAppointmentEmail !== false && data.email) {
          console.log(`[EMAIL DISPATCH] Appointment email sent to ${data.email} for staff ${data.name} as ${item.authorityLevel}`);
          emailSent = true;
        }

        return res.json({
          success: true,
          emailSent,
          emailRecipient: data.email,
          staff: item,
          admins: admins
        });
      }

      case "toggleAdminStaffStatus": {
        const payload = args[0] || {};
        const id = typeof payload === 'object' ? (payload.id || payload.adminId) : payload;
        const target = admins.find(a => String(a.id).toLowerCase() === String(id).toLowerCase() || String(a.adminId).toLowerCase() === String(id).toLowerCase());
        if (target) {
          target.active = !target.active;
          target.status = target.active ? "ACTIVE" : "SUSPENDED";
          return res.json({ success: true, active: target.active, status: target.status });
        }
        return res.json({ success: false, error: "Staff member not found" });
      }

      case "deleteAdminStaff": {
        const payload = args[0] || {};
        const id = typeof payload === 'object' ? (payload.id || payload.adminId) : payload;
        admins = admins.filter(a => String(a.id).toLowerCase() !== String(id).toLowerCase() && String(a.adminId).toLowerCase() !== String(id).toLowerCase());
        return res.json({ success: true, admins });
      }

      // Coupons & Auto Coupon Approval System
      case "getAllCoupons":
        return res.json(coupons);

      case "validateCoupon": {
        const data = args[0] || {};
        const code = String(data.code || "").trim().toUpperCase();
        const subtotal = Number(data.subtotal) || 0;

        if (!code) return res.json({ valid: false, message: "Please enter a coupon code." });

        let coupon = coupons.find(c => String(c.code).toUpperCase() === code && (c.active !== false));

        if (!coupon) {
          if (code === "WELCOME100" || code === "AAHAR100") {
            coupon = { id: "CPN100", code: "WELCOME100", discountType: "FLAT", discountValue: 100, minOrderValue: 400, active: true };
          } else if (code === "AAHAR50" || code === "WELCOME50") {
            coupon = { id: "CPN50", code: "AAHAR50", discountType: "FLAT", discountValue: 50, minOrderValue: 250, active: true };
          } else if (code === "OFF10" || code === "AAHAR10") {
            coupon = { id: "CPN10", code: "AAHAR10", discountType: "PERCENT", discountValue: 10, minOrderValue: 199, active: true };
          }
        }

        if (!coupon) {
          return res.json({ valid: false, message: "Invalid coupon code or expired." });
        }

        const minOrder = Number(coupon.minOrderValue || coupon.minOrder) || 0;
        if (subtotal < minOrder) {
          return res.json({ valid: false, message: `Minimum order amount of ₹${minOrder} required for coupon ${code}.` });
        }

        let discount = 0;
        if (coupon.discountType === "PERCENT" || coupon.type === "PERCENT") {
          discount = Math.round((subtotal * (Number(coupon.discountValue || coupon.discount) || 10)) / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
        } else {
          discount = Number(coupon.discountValue || coupon.discount || coupon.amount) || 50;
        }

        return res.json({
          valid: true,
          coupon: coupon,
          discount: discount,
          message: `🎉 Coupon '${coupon.code}' applied! Saved ₹${discount}`
        });
      }

      case "saveCoupon": {
        const data = args[0] || {};
        const id = data.id || ("CPN" + Date.now().toString().slice(-5));
        const item = { ...data, id, active: data.active !== false };
        const idx = coupons.findIndex(c => String(c.id) === String(id));
        if (idx !== -1) coupons[idx] = item;
        else coupons.push(item);
        return res.json({ success: true, id, coupon: item });
      }

      case "deleteCoupon": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        coupons = coupons.filter(c => String(c.id) !== String(id));
        return res.json({ success: true });
      }

      case "getAutoCouponRules":
        return res.json(autoCouponRules);

      case "saveAutoCouponRule": {
        const data = args[0] || {};
        const id = data.id || ("RULE" + Date.now().toString().slice(-5));
        const item = { ...data, id, active: data.active !== false };
        const idx = autoCouponRules.findIndex(r => String(r.id) === String(id));
        if (idx !== -1) autoCouponRules[idx] = item;
        else autoCouponRules.push(item);
        return res.json({ success: true, id, rule: item });
      }

      case "deleteAutoCouponRule": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        autoCouponRules = autoCouponRules.filter(r => String(r.id) !== String(id));
        return res.json({ success: true });
      }

      case "getAutoCouponApprovals":
        return res.json(autoCouponApprovals);

      case "approveAutoCoupon": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        const app = autoCouponApprovals.find(a => String(a.id) === String(id));
        if (app) {
          app.status = "APPROVED";
          return res.json({ success: true });
        }
        return res.json({ success: false, error: "Approval not found" });
      }

      case "rejectAutoCoupon": {
        const id = typeof args[0] === 'object' ? args[0]?.id : args[0];
        const app = autoCouponApprovals.find(a => String(a.id) === String(id));
        if (app) {
          app.status = "REJECTED";
          return res.json({ success: true });
        }
        return res.json({ success: false, error: "Approval not found" });
      }

      // Vision & Trust Pills Management
      case "getVisionPillsData":
        return res.json(visionPillsData);

      case "saveVisionPillData": {
        const data = args[0] || {};
        if (data && data.id) {
          visionPillsData[data.id] = {
            ...(visionPillsData[data.id] || {}),
            ...data
          };
          return res.json({ success: true, pill: visionPillsData[data.id] });
        }
        return res.json({ success: false, error: "Invalid vision pill data" });
      }

      // Artisan Heritage Story Management
      case "getArtisanHeritageStory":
        return res.json(artisanHeritageStoryData);

      case "saveArtisanHeritageStory": {
        const data = args[0] || {};
        artisanHeritageStoryData = {
          ...artisanHeritageStoryData,
          ...data
        };
        return res.json({ success: true, story: artisanHeritageStoryData });
      }

      case "addArtisanGratitudeNote": {
        const payload = args[0] || {};
        const newNote = {
          id: "NOTE_" + Date.now(),
          customerName: payload.customerName || "Warm Customer",
          location: payload.location || "India",
          message: payload.message || "Thank you for the delicious authentic pickles!",
          date: new Date().toISOString().split("T")[0]
        };
        if (!artisanHeritageStoryData.gratitudeNotes) artisanHeritageStoryData.gratitudeNotes = [];
        artisanHeritageStoryData.gratitudeNotes.unshift(newNote);
        return res.json({ success: true, note: newNote, notes: artisanHeritageStoryData.gratitudeNotes });
      }

      // Database Setup
      case "setupDatabase":
        return res.json({ success: true, message: "Database Setup Complete (In-Memory)" });

      // Sidebar & FAQs Configuration
      case "getSidebarConfig":
        return res.json(sidebarConfig);

      case "saveSidebarConfig": {
        const data = args[0];
        if (Array.isArray(data)) {
          sidebarConfig = data;
        }
        return res.json({ success: true, sidebar: sidebarConfig });
      }

      case "getSupportFaqs":
        return res.json(supportFaqsData);

      case "saveSupportFaqs": {
        const data = args[0] || {};
        supportFaqsData = { ...supportFaqsData, ...data };
        return res.json({ success: true, data: supportFaqsData });
      }

      // Inventory & Stock Management
      case "getInventoryList": {
        const list = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.offerPrice || p.mrp || p.price || 0,
          weight: p.weight || p.unit || '500g Jar',
          stock: p.stock !== undefined ? p.stock : (p.quantity !== undefined ? p.quantity : 50)
        }));
        return res.json(list);
      }

      case "updateProductStock": {
        const payload = args[0] || {};
        const id = payload.id;
        const newStock = Number(payload.newStock);
        const p = products.find(item => String(item.id) === String(id));
        if (p) {
          p.stock = newStock;
          return res.json({ success: true, stock: newStock });
        }
        return res.json({ success: false, error: "Product not found" });
      }

      default:
        console.log(`[RPC] Executing fallback for action: ${action}`);
        return res.json({ success: true, action, message: `Handled RPC action: ${action}` });
    }
  } catch (err: any) {
    console.error(`[RPC ERROR] in ${action}:`, err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// App Entry Point
app.get("/", (req, res) => {
  try {
    const html = renderAppHtml();
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err: any) {
    console.error("Error rendering HTML:", err);
    res.status(500).send("Application Error: " + err.message);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
