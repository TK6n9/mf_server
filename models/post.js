const Sequelize = require("sequelize");

class Post extends Sequelize.Model {
  static initiate(sequelize) {
    Post.init(
      {
        title: {
          type: Sequelize.STRING(40),
          allowNull: true,
        },
        content: {
          type: Sequelize.STRING(140),
          allowNull: true,
        },
        img: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        like: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Post",
        tableName: "posts",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {
    db.Post.belongsTo(db.User);
    db.Post.belongsToMany(db.User, { as: "Likers", through: "Like" });
    db.Post.belongsToMany(db.Hashtag, { through: "PostHashtag" });
  }
}

module.exports = Post;
