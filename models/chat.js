const Sequelize = require("sequelize");

class Chat extends Sequelize.Model {
  static initiate(sequelize) {
    Chat.init(
      {
        room: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        user: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        chat: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        gif: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Chat",
        tableName: "chats",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {}
}

module.exports = Chat;
