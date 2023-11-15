const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { isLoggedIn } = require("../middlewares");
const { Post, User, Comment } = require("../models");
const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, res, done) {
      done(null, "uploads");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      done(null, `${basename}_${new Date().getTime()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/", isLoggedIn, upload.single("img"), async (req, res, next) => {
  try {
    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      UserId: req.user.id,
      img: req.file ? req.file.filename : null,
    });

    res.status(201).json("등록성공");
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.post("/comment", isLoggedIn, async (req, res, next) => {
  try {
    const comment = await Comment.create({
      comment: req.body.reply,
      replyUserName: req.body.UserId,
      PostId: req.body.PostId,
    });
    res.status(201).json("등록성공");
  } catch (error) {
    console.log("🧨🔥🚀__error", error);
    next(error);
  }
});
router.get("/comments/:postId", async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId);
    const comments = await Comment.findAll({
      where: { PostId: postId },
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).send("댓글가져오기 에러남");
    next(error);
  }
});

router.delete("/comment/:id", isLoggedIn, async (req, res, next) => {
  try {
    const id = req.params.id;
    const comment = await Comment.findOne({
      where: {
        id: id,
        replyUserName: req.body.UserId, // Make sure that `body-parser` middleware is used to parse the body
      },
    });

    if (!comment) {
      return res.status(403).send("삭제할 수 없는 댓글입니다.");
    }
    await comment.destroy(); // 댓글 삭제
    res.status(200).json({ id: id, message: "댓글이 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).send("댓글 삭제 중 에러가 발생했습니다.");
    next(error);
  }
});

router.get("/:postId", isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
      include: [
        {
          model: User,
          as: "User", // models/post.js에서 정의한 관계명
          attributes: ["userName"], // 가져올 필드
        },
      ],
    });
    if (!post) {
      return res.status(404).json({ error: "해당 게시물을 찾을 수 없습니다." });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete("/:postId", isLoggedIn, async (req, res, next) => {
  try {
    await Post.destroy({
      where: {
        id: parseInt(req.params.postId),
        UserId: req.user.id,
      },
    });
    res.status(200).json({ PostId: parseInt(req.params.postId) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.put(
  "/:postId",
  isLoggedIn,
  upload.single("img"),
  async (req, res, next) => {
    try {
      const post = await Post.findOne({
        where: {
          id: parseInt(req.params.postId),
          UserId: req.user.id,
        },
      });
      if (!post) {
        return res
          .status(404)
          .json({ error: "해당 게시물을 찾을 수 없습니다." });
      }
      const updatedData = {
        title: req.body.title,
        content: req.body.content,
      };

      if (req.file) {
        if (post.img) {
          // Remove the old image file from the server
          fs.unlinkSync(path.join(__dirname, "..", "uploads", post.img));
        }
        updatedData.img = req.file.filename;
      }
      await post.update(updatedData);
      res.status(200).json("수정성공");
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

//좋아요관리
// 좋아요 수를 가져오는 라우트
router.get("/:postId/likeCount", isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findByPk(postId);
    if (post) {
      res.status(200).json({ likeCount: post.like });
    } else {
      res.status(404).send("게시물을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 좋아요 상태를 업데이트하는 라우트
// router.post("/:postId/like", isLoggedIn, async (req, res, next) => {
//   try {
//     const postId = req.params.postId;
//     const post = await Post.findByPk(postId);

//     if (post) {
//       const newLikeCount = req.body.isFilled ? post.like - 1 : post.like + 1;
//       await post.update({ like: newLikeCount });
//       res.status(200).json({ likeCount: newLikeCount });
//     } else {
//       res.status(404).send("게시물을 찾을 수 없습니다.");
//     }
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

router.post("/:postId/like", isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id; // 로그인된 사용자 ID
    const post = await Post.findByPk(postId, {
      include: [
        {
          model: User,
          as: "Likers",
          attributes: ["id"],
        },
      ],
    });

    if (post) {
      const isLiked = post.Likers.some((liker) => liker.id === userId);
      if (isLiked) {
        // 이미 좋아요를 누른 상태라면 좋아요 제거
        await post.removeLiker(userId);
        post.like -= 1;
      } else {
        // 좋아요를 누르지 않았다면 좋아요 추가
        await post.addLiker(userId);
        post.like += 1;
      }
      await post.save();
      res.status(200).json({ likeCount: post.like });
    } else {
      res.status(404).send("게시물을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get("/:postId/check-like", isLoggedIn, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id; // Logged-in user's ID

    const post = await Post.findByPk(postId, {
      include: [
        {
          model: User,
          as: "Likers",
          attributes: ["id"],
        },
      ],
    });

    if (!post) {
      return res.status(404).send("게시물을 찾을 수 없습니다.");
    }

    // Check if the user is in the list of likers
    const isLiked = post.Likers.some((liker) => liker.id === userId);
    res.status(200).json({ isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).send("좋아요 상태 확인 중 에러가 발생했습니다.");
    next(error);
  }
});

//마이페이지에서 userId로 검색해서 내가 쓴게시글 목록 다 가져오기
router.get("/mypage/:userId", isLoggedIn, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    // const posts = await Post.find({ UserId: userId });
    const posts = await Post.findAll({ where: { UserId: userId } });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
