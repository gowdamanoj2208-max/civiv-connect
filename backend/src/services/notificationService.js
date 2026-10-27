const Notification = require('../models/Notification');

const createNotification = async ({ recipient, title, message, type, complaint, complaintId }) => {
  try {
    await Notification.create({ recipient, title, message, type, complaint, complaintId });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };
