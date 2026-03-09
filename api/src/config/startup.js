/**
 * Validate required environment variables at startup.
 * Throws immediately if any required variable is missing.
 */
function validateEnv() {
  const required = ['MONGO_URL', 'TOKEN_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please set them in your .env file or environment.'
    );
  }
}

module.exports = { validateEnv };
