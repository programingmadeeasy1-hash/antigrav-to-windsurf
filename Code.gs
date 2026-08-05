// ======================================================
// WEB APP ENTRY POINT
// ======================================================

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.setup === "true") {
      if (typeof setupDatabase === "function") {
        setupDatabase();
        return HtmlService.createHtmlOutput("Database Setup Complete.");
      }
    }

    const template = HtmlService.createTemplateFromFile("index");
    template.businessName = CONFIG && CONFIG.BUSINESS_NAME ? CONFIG.BUSINESS_NAME : "AaharShree Naturals";
    template.version = CONFIG && CONFIG.VERSION ? CONFIG.VERSION : "1.0";

    return template
      .evaluate()
      .setTitle(template.businessName)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    console.error("Critical error in doGet: " + error.message);
    return HtmlService.createHtmlOutput("<b>Application Error:</b> " + error.message);
  }
}

// ======================================================
// INCLUDE HTML HELPER
// ======================================================
/**
 * Usage in Index.html: <?!= include('FileName'); ?>
 */
function include(filename) {
  try {
    // This allows you to use file names regardless of .html extension
    const cleanName = filename.replace(/\.html$/, '');
    return HtmlService.createHtmlOutputFromFile(cleanName).getContent();
  } catch (err) {
    console.error("Include failed: " + filename);
    return "<!-- Error including " + filename + " -->";
  }
}

/**
 * Global error logger for client-side calls
 */
function logError(err) {
  console.error("Client side error: " + JSON.stringify(err));
}