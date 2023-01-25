const express = require("express");
const fs = require("fs");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const Image = require("../../models/Image");
const auth = require("../../middleware/auth-token");
const Profile = require("../../models/Profile");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

//const fileUpload = require("../../middleware/file-upload");

const { cloudinary } = require("../../utils/cloudinary");

// @route   GET api/users
// @desc    Test route
// @access  Public
router.get("/", (req, res) => {
  res.send("User route");
});

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  "/",

  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 5 or more characters"
    ).isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      // See if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      // Create a new user
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },

        (err, token) => {
          if (err) throw err;

          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST api/users/upload
// @desc    Upload user image
// @access  Public

router.post("/upload", [auth, upload.single("image")], async (req, res) => {
  try {
    const fileStr = req.file.path;
    const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: "ml_default",
    });

    const user = await User.findById(req.user.id).select("-password");
    const profile = await Profile.findOne({ user: req.user.id });

    const image = new Image({
      user: req.user.id,
      publicId: uploadedResponse.public_id,
      url: uploadedResponse.secure_url,
    });

    await profile.updateOne({ image: image.url });

    await image.save();

    res.json(image);
  } catch (err) {
    console.error(err);

    res.status(500).json({ err: "Something went wrong" });
  }
});

// @route   GET api/users/images
// @desc    Get user image
// @access  Public

router.get("/images", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const images = await Image.find({ user: req.user.id });

    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Something went wrong" });
  }
});

// @route   DELETE api/users/images/:id
// @desc    Delete user image
// @access  Public

router.delete("/images/:id", auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ msg: "Image not found" });
    }

    // Check user
    if (image.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await cloudinary.uploader.destroy(image.publicId);

    await image.remove();

    res.json({ msg: "Image removed" });
  } catch (err) {
    console.error(err.message);

    res.status(500).send("Server Error");
  }
});

module.exports = router;
