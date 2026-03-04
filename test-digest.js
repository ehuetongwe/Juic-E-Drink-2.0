require('dotenv').config();
const { handler } = require('./netlify/functions/production-digest');

(async () => {
  try {
    console.log("Testing production digest handler locally...");
    const response = await handler({}, {});
    console.log("Mock Event Response:", response);
  } catch (err) {
    console.error("Test failed:", err);
  }
})();
