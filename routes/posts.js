const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Post, User } = require("../models");

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1; // page 파라미터 추가
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sort = req.query.sort || "desc"; // 기본값은 'desc' (최신순)
    // 페이지 값 검증
    if (page < 1) {
      return res.status(400).json({ error: "Invalid page number" });
    }
    const totalPosts = await Post.count();
    const totalPages = Math.ceil(totalPosts / pageSize); // 전체 페이지 수
    const order =
      sort === "asc" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]];
    const posts = await Post.findAll({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      include: [
        {
          model: User,
          as: "User", // models/post.js에서 정의한 관계명
          attributes: ["userName"], // 가져올 필드
        },
      ],
      order,
    });

    res.status(200).json({ posts, totalPosts, totalPages });
  } catch (error) {
    console.error(error);
    next(error);
  }
});
module.exports = router;
