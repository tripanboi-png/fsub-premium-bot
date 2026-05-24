const User = require('../database/models/User');
const Admin = require('../database/models/Admin');
const config = require('../config');

/**
 * Upsert user in database
 */
async function upsertUser(from) {
  return User.findOneAndUpdate(
    { user_id: from.id },
    {
      user_id: from.id,
      username: from.username || null,
      first_name: from.first_name || '',
      last_name: from.last_name || '',
      last_active: new Date(),
    },
    { upsert: true, new: true }
  );
}

/**
 * Get total user count
 */
async function getUserCount() {
  return User.countDocuments();
}

/**
 * Get all users (paginated for broadcast)
 */
async function getAllUsers(page = 0, limit = 100) {
  return User.find({ is_banned: false })
    .skip(page * limit)
    .limit(limit)
    .select('user_id');
}

/**
 * Check if user is admin or owner
 */
async function isAdmin(userId) {
  if (userId === config.OWNER_ID) return true;
  const admin = await Admin.findOne({ user_id: userId });
  return !!admin;
}

/**
 * Check if user is owner
 */
function isOwner(userId) {
  return userId === config.OWNER_ID;
}

/**
 * Add admin
 */
async function addAdmin(userId, data = {}, addedBy = null) {
  return Admin.findOneAndUpdate(
    { user_id: userId },
    {
      user_id: userId,
      username: data.username || null,
      first_name: data.first_name || '',
      added_by: addedBy,
      level: 1,
    },
    { upsert: true, new: true }
  );
}

/**
 * Remove admin
 */
async function removeAdmin(userId) {
  return Admin.findOneAndDelete({ user_id: userId });
}

/**
 * Get all admins
 */
async function getAdmins() {
  return Admin.find({});
}

module.exports = {
  upsertUser,
  getUserCount,
  getAllUsers,
  isAdmin,
  isOwner,
  addAdmin,
  removeAdmin,
  getAdmins,
};
