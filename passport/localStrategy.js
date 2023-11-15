const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const { User } = require("../models");

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "userName",
        passwordField: "password",
      },
      async (userName, password, done) => {
        try {
          // 로그인 전략
          const user = await User.findOne({
            where: { userName },
          });

          if (!user) {
            // 서버에러, 성공, 클라이언트 에러
            done(null, false, { reason: "존재하지 않는 사용자입니다!" });
          }

          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }

          return done(null, false, { reason: "비밀번호가 틀렸습니다." });
        } catch (error) {
          console.error(error);
          done(error, false);
        }
      }
    )
  );
};
