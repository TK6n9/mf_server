const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("../models/user");

exports.join = async (req, res, next) => {
  const { userNameState, passwordState } = req.body;

  try {
    const exUser = await User.findOne({ where: { userName: userNameState } });

    if (exUser) {
      return res.status(400).json("이미있는 계정입니다.");
    }
    //없는 사람일때
    const hash = await bcrypt.hash(passwordState, 12);
    await User.create({
      userName: userNameState,
      password: hash,
    });
    return res.status(200).json("회원가입성공");
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      console.log("🚀__info", info);
      return res.status(401).json({ message: info.reason });
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    return req.login(user, async (err) => {
      if (err) {
        return next(err);
      }
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: ["id", "userName"],
      });

      // 내부적으로 req.setHeader("Cookie", "cxlhy")을 구현
      return res.status(200).json(fullUserWithoutPassword);
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(() => {
    res.status(200).json("성공정 로그아웃");
  });
};
