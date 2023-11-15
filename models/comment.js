const Sequelize = require("sequelize");

class Comment extends Sequelize.Model {
  static initiate(sequelize) {
    Comment.init(
      {
        comment: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        replyUserName: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        PostId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },

      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Comment",
        tableName: "comments",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {
    db.Comment.belongsTo(db.User);
    db.Comment.belongsTo(db.Post);
  }
}

module.exports = Comment;
