const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Chat = require("../models/chat");
const Room = require("../models/room");

const { removeRoom: removeRoomService } = require("../services");

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.findAll({});
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ error: "방조회에러" });
  }
});

router.post("/room", async (req, res) => {
  try {
    const newRoom = await Room.create({
      title: req.body.title,
      max: req.body.max,
      owner: req.body.owner,
      password: req.body.password,
    });
    const io = req.app.get("io");
    io.of("/room").emit("newRoom", newRoom);
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: "방만들기에러" });
  }
});

router.get("/room/:id", async (req, res) => {
  try {
    const room = await Room.findOne({ where: { id: req.params.id } });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    // Add password and max occupancy logic as needed
    const chats = await Chat.findAll({
      where: { room: room.id },
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json({ room, chats });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/room/:id", async (req, res) => {
  try {
    await removeRoomService(req.params.id);
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/room/:id/chat", async (req, res) => {
  try {
    const chat = await Chat.create({
      room: req.params.id,
      // user: req.session.color,
      chat: req.body.chat,
    });
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat);
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

try {
  fs.readdirSync("uploads");
} catch (err) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads/");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = router;
