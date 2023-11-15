const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const morgan = require("morgan");
const session = require("express-session");
const dotenv = require("dotenv");
const http = require("http");
const helmet = require("helmet");
const hpp = require("hpp");
const redis = require("redis");
// const RedisStore = require("connect-redis")(session);
const socketIo = require("socket.io");
const cors = require("cors");
dotenv.config();

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
  legacyMode: true,
});
redisClient.connect().catch(console.error);

const v1 = require("./routes/v1");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const postsRouter = require("./routes/posts");
const serverRouter = require("./routes/server");
const indexRouter = require("./routes");
const { sequelize } = require("./models");
const passportConfig = require("./passport");
const { default: RedisStore } = require("connect-redis");

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  // 쿠키 전송을 위해 필요
};
// const io = socketIo(server);
const io = socketIo(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));

passportConfig();

app.set("port", process.env.PORT || 8001);
//alter: true  칼럼추가기능
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

if (process.env.NODE_ENV === "production") {
  app.enable("trust proxy");
  app.use(morgan("combined"));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}

// app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 간단한 객체만 허용 true중첩된 객체 허용
app.use(cookieParser(process.env.COOKIE_SECRET));
app.set("io", io);

app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET,
    store: new RedisStore({ client: redisClient }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
//이미지서버에 접근하게 위에있는데 이상함

app.use("/uploads", express.static("uploads"));

app.use("/v1", v1);
app.use("/auth", authRouter);
app.use("/", indexRouter);
app.use("/post", postRouter);
app.use("/posts", postsRouter);
app.use("/server", serverRouter);

server.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
