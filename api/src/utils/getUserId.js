/**
 * Resolve user_id from a Mongoose user document.
 * Prefers the explicit user_id field, falls back to _id.
 */
function getUserId(user) {
  return String(user.user_id || user._id);
}

module.exports = getUserId;
