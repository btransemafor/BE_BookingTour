const { Client } = require('pg');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');
dotenv.config();

console.log(process.env.CLOUD_API_KEY)
const config = {
  "development": {
      "username": process.env.DB_USERNAME,
      "password": process.env.DB_PASSWORD,
      "database": process.env.DB_DATABASE,
      "host":     process.env.DB_HOST,
      "dialect": "postgres"
  },
  "test": {
      "username": "root",
      "password": null,
      "database": process.env.DB_DATABASE,
      "host": "127.0.0.1",
      "dialect": "postgres"
  },
  "production": {
      "username": "root",
      "password": null,
      "database": "database_production",
      "host": "127.0.0.1",
      "dialect": "postgres"
  }, 
  pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
};

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
    pool: config.pool
  }
);


async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };

