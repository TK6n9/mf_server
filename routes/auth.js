const express = require("express");
const passport = require("passport");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares");
const { join, login, logout } = require("../controllers/auth");
const router = express.Router();
router.post("/join", isNotLoggedIn, join);
router.post("/login", isNotLoggedIn, login);
router.get("/logout", isLoggedIn, logout);

const { Post, User, Comment } = require("../models");

// router.post("/follow", async (req, res) => {
//   const { followerId, followingId } = req.body;
//   console.log("🚀__{ followerId, followingId }", { followerId, followingId });

//   // 이미 팔로우하고 있는지 확인
//   const existingFollow = await User.findOne({
//     include: [
//       {
//         model: User,
//         as: "Followers",
//         where: { id: followerId },
//       },
//     ],
//   });
//   if (existingFollow) {
//     return res.status(409).send("이미 팔로우하고 있습니다.");
//   }

//   try {
//     const newFollow = await User.create({
//       FollowerId: followerId,
//       FollowingId: followingId,
//     });
//     return res.status(200).send("팔로우 성공");
//   } catch (error) {
//     console.error("팔로우 에러:", error);
//     return res.status(500).send("팔로우 실패");
//   }
// });
//gpt천재
router.post("/follow", async (req, res, next) => {
  const { followerId, followingId } = req.body;
  try {
    // Following을 받는 User 인스턴스를 찾습니다.
    const following = await User.findByPk(followingId);
    if (!following) {
      return res.status(404).send("팔로잉할 사용자를 찾을 수 없습니다.");
    }
    // Follower를 추가하는 User 인스턴스를 찾습니다.
    const follower = await User.findByPk(followerId);
    if (!follower) {
      return res.status(404).send("팔로워 사용자를 찾을 수 없습니다.");
    }
    // 이미 팔로우하고 있는지 확인합니다.
    const followers = await following.getFollowers({
      where: { id: followerId },
    });
    if (followers.length > 0) {
      return res.status(409).send("이미 팔로우하고 있습니다.");
    }
    // 팔로우 관계를 추가합니다.
    await following.addFollower(follower);
    res.status(200).send("팔로우 성공");
  } catch (error) {
    console.error("팔로우 에러:", error);
    return res.status(500).send("팔로우 실패");
  }
});
//언팔
router.delete("/unfollow", async (req, res) => {
  const { followerId, followingId } = req.body; // DELETE 메서드의 body를 사용하려면 body-parser의 옵션 설정이 필요할 수 있습니다.
  try {
    // Following을 받는 User 인스턴스를 찾습니다.
    const following = await User.findByPk(followingId);
    if (!following) {
      return res.status(404).send("언팔로우할 사용자를 찾을 수 없습니다.");
    }
    // Follower를 삭제하는 User 인스턴스를 찾습니다.
    const follower = await User.findByPk(followerId);
    if (!follower) {
      return res.status(404).send("팔로워 사용자를 찾을 수 없습니다.");
    }
    // 이미 팔로우하고 있는지 확인합니다.
    const followers = await following.getFollowers({
      where: { id: followerId },
    });
    if (followers.length === 0) {
      return res.status(404).send("팔로우하고 있지 않습니다.");
    }
    // 팔로우 관계를 삭제합니다.
    await following.removeFollower(follower);
    res.status(200).send("언팔로우 성공");
  } catch (error) {
    console.error("언팔로우 에러:", error);
    res.status(500).send("언팔로우 실패");
  }
});

router.get("/isFollowing", async (req, res) => {
  const followerId = req.query.followerId;
  const followingId = req.query.followingId;

  try {
    // 'Follow' 모델이나 관계를 이용하여 팔로우 여부를 확인합니다.
    const isFollowing = await User.findOne({
      include: [
        {
          model: User,
          as: "Followers",
          where: { id: followerId },
          attributes: [],
        },
      ],
      where: {
        id: followingId,
      },
    });

    if (isFollowing) {
      return res.status(200).json({ following: true });
    } else {
      return res.status(200).json({ following: false });
    }
  } catch (error) {
    console.error("팔로우 상태 확인 에러:", error);
    return res.status(500).send("팔로우 상태 확인 실패");
  }
});
// 나를 팔로우하는 사람(팔로워) 조회 API
router.get("/myFollowers", async (req, res) => {
  const { userId } = req.query; // 조회하려는 사용자의 ID
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send("사용자를 찾을 수 없습니다.");
    }
    // 여기에서 getFollowers 대신 getFollowings을 사용해야 합니다.
    const followers = await user.getFollowers();
    res.status(200).json({ followers });
  } catch (error) {
    console.error("팔로워 조회 에러:", error);
    res.status(500).send("팔로워 조회 실패");
  }
});

// 내가 팔로우하는 사람(팔로잉) 조회 API
router.get("/myFollowing", async (req, res) => {
  const { userId } = req.query; // 조회하려는 사용자의 ID
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send("사용자를 찾을 수 없습니다.");
    }
    // 여기에서 getFollowing 대신 getFollowings을 사용해야 합니다.
    const following = await user.getFollowings();
    res.status(200).json({ following });
  } catch (error) {
    console.error("팔로잉 조회 에러:", error);
    res.status(500).send("팔로잉 조회 실패");
  }
});

module.exports = router;
