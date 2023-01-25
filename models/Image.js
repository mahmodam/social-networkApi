const mongoose = require("mongoose");

const imgSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  url: { type: String },
  publicId: { type: String },
});

module.exports = mongoose.model("image", imgSchema);
