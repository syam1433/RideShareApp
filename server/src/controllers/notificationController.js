const Notification = require("../models/Notifications");

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    next(error);
  }
};