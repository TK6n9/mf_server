const { v4: uuidv4 } = require("uuid");
const { User, Domain } = require("../models");

exports.renderLogin = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findOne({
        where: { id: req.user.id },
        attributes: ["id", "userName"],
        include: [],
      });
      res.status(200).json(user);
    } else {
      res.status(200).json(null);
    }
  } catch (err) {
    //에러가있으면 next()
    console.error(err);
    next(err);
  }
};

exports.createDomain = async (req, res, next) => {
  try {
    await Domain.create({
      UserId: req.user.id,
      host: req.body.host,
      type: req.body.type,
      clientSecret: uuidv4(),
    });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    next(err);
  }
};
