// Load environment variables for testing
require("dotenv").config({ path: ".env.local" });

// Global test timeout
jest.setTimeout(15000);
