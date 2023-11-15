const passport = require("passport");
const local = require("./localStrategy");
const { User } = require("../models");

module.exports = () => {
  // req.login에서 넘어옴
  passport.serializeUser((user, done) => {
    done(null, user.id); // 유저 id만 저장
  });

  // 로그인 이후 요청마다 실행
  // id => 사용자 정보
  passport.deserializeUser(async (id, done) => {
    // id를 통해서 유저를 복구
    try {
      const user = await User.findOne({ where: { id } });
      done(null, user); //req.user에 넣어준다.
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};
