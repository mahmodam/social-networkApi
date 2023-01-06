const express = require("express");
const connectDB = require("./config/db");
const users = require("./routes/api/users");
const auth = require("./routes/api/auth");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");
const app = express();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
