// Helper functions for the Netlify function in CommonJS format
function log(message, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

// Export the functions for use in server.cjs
module.exports = {
  log
};