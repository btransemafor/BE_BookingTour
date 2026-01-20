const express = require("express");
const cors = require("cors");
require("dotenv").config(); // important!
const { sequelize } = require("./config/db.config");
const { db } = require("./models/index");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

//  Thêm dòng này vào NGAY SAU khi tạo app
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

const paymentController = require("./controllers/payment.controller");
// Cấu hình corsOptions
const corsOptions = {
  origin: ["https://pay.payos.vn", "http://localhost:8081"], // Allow PayOS and your local dev server
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "rsc", "next-url"], // Thêm header rsc,
};
app.use(cors(corsOptions));

// Cấu hình thư mục views để phục vụ file tĩnh
app.use(express.static(path.join(__dirname, "views")));

// Không dùng `express.json()` và `express.urlencoded()` ở đây vì sẽ ảnh hưởng tới các route upload file
// Sử dụng JSON parser cho những route không phải upload file
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static route để có thể truy cập ảnh từ client
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const auth = require("./middleware/authJwt");
const { unless } = require("express-unless");

// Call Router
const router = require("./routes/index.routes");
const errorHandler = require("./middleware/error");

// Get model Role
const Role = db.role;

// Sync database
sequelize.sync({ alter: true }).then(() => {
  console.log("Drop and Resync Db");
  initial();
  initial1();
});

function initial() {
  Role.create({
    id: 1,
    name: "user",
  });

  Role.create({
    id: 2,
    name: "admin",
  });
}

async function initial1() {
  const defaultVariants = ["S", "M", "L"];

  for (const name of defaultVariants) {
    const [variant, created] = await db.variant.findOrCreate({
      where: { variant_name: name },
    });

    if (created) {
      console.log(`Created default variant: ${name}`);
    }
  }
}
// Static route để có thể truy cập ảnh từ client
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route cho returnUrl
// Route cho returnUrl
app.get("/return", (req, res) => {
  res.setHeader("ngrok-skip-browser-warning", "true"); // ✅ set trực tiếp
  res.sendFile(path.join(__dirname, "views", "return.html"));
});

// Route cho cancelUrl
app.get("/cancel", (req, res) => {
  res.setHeader("ngrok-skip-browser-warning", "true"); //  set trực tiếp
  res.sendFile(path.join(__dirname, "views", "payment-cancel.html"));
});

// Apply unless() with the correct full route
auth.authenticateToken.unless = unless;
app.use(
  auth.authenticateToken.unless({
    path: [
      { url: "/api/auth/login", methods: ["POST"] },
      { url: "/api/auth/reset-password", methods: ["POST"] },
      { url: "/api/auth/send-reset-otp", methods: ["POST"] },
      { url: "/api/auth/verify-otp", methods: ["POST"] },
      { url: "/api/auth/register", methods: ["POST"] },
      { url: "/api/otp/verify-account", methods: ["POST"] },
      { url: "/api/auth/resend-otp-verify", methods: ["POST"] },
      { url: "/api/categories", methods: ["GET"] },
      { url: "/api/products", methods: ["GET"] },
      { url: "/api/products/v2", methods: ["GET"] },
      { url: "/api/variant-products", methods: ["GET"] },
      { url: "/api/products/search", methods: ["GET"] },
      { url: "/api/banners", methods: ["GET"] },
      
      { url: "/api/promotions/public", methods: ["GET"] },
      { url: /^\/api\/promotions\/public\/[a-zA-Z0-9-_]+$/, methods: ["GET"] },

      { url: "/api/auth/google/verify", methods: ["POST"] },
      { url: "/api/contacts", methods: ["POST"] },
      {
        url: "/api/auth/refresh-token",
        methods: ["POST"],
      },
      {
        url: "/api/chat",
        methods: ["POST"],
      },
      {
        url: "/api/payments/webhook/payos",
        methods: ["POST"],
      },

      {
        url: "/api/payments/payment-status",
        methods: ["GET"],
      },

      {
        url: /^\/api\/product\/([a-zA-Z0-9-]+)\/reviews$/,
        methods: ["GET"],
      },
      { url: "/api/shipping", methods: ["GET"] },
      { url: /^\/api\/products\/search$/, methods: ["GET"] },
      { url: /^\/api\/products\/\d+\/variants$/, methods: ["GET"] },
      { url: /^\/api\/products\/(\d+)$/, methods: ["GET"] },
      { url: /^\/api\/products\/by-category\/\d+$/, methods: ["GET"] },
      { url: "/", methods: ["GET"] },
    ],
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to omgniceeeee!" });
});

app.use("/api", router);

// Apply error handler at the end
app.use(errorHandler);

// kết nối db trước khi chạy server
app.listen(process.env.port, () => {
  console.log(`🚀 server is running on port ${process.env.port}`);
});
