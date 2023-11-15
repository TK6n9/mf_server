const Room = require("../models/room");
const Chat = require("../models/chat");

exports.removeRoom = async (roomId) => {
  try {
    await Room.deleteOne({ _id: roomId });
    await Chat.deleteMany({ room: roomId });
  } catch (error) {
    throw error;
  }
};
