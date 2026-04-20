const Chat = require("../models/Chat");

exports.getRideMessages = async (req, res, next) => {
  try {
    const messages = await Chat.find({ ride: req.params.rideId }).populate("sender", "name email role");
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { ride, message } = req.body;
    const chat = await Chat.create({ ride, message, sender: req.user.id });
    return res.status(201).json(chat);
  } catch (error) {
    return next(error);
  }
};