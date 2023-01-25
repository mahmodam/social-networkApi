const fs = require("fs");
const path = require("path");
const express = require("express");
const connectDB = require("./config/db");
const users = require("./routes/api/users");
const auth = require("./routes/api/auth");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

//const fileUpload = require("express-fileupload");

const app = express();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

//app.use(fileUpload());

//app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
