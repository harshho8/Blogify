const { Router } = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Cloudinary configuration using environment variables
cloudinary.config({
  cloud_name:'dyal33uk3',
  api_key: '982289125571571',
  api_secret: 'a9-cSilRYsKvfLV48_D2sXRwPuw',
});
const Blog = require("../models/blog");
const Comment = require("../models/comments");
const router = Router();

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"));
    }
  },
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", (req, res) => {
  Blog.findById(req.params.id)
    .populate("createdBy")
    .exec((err, blog) => {
      if (err) {
        return res.status(500).send(err);
      }
      Comment.find({ blogId: req.params.id })
        .populate("createdBy")
        .exec((err, comments) => {
          if (err) {
            return res.status(500).send(err);
          }
          return res.render("blog", {
            user: req.user,
            blog,
            comments,
          });
        });
    });
});

router.post("/comment/:blogId", (req, res) => {
  Comment.create(
    {
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    },
    (err) => {
      if (err) {
        return res.status(500).send(err);
      }
      return res.redirect(`/blog/${req.params.blogId}`);
    }
  );
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blogs",
    });

    // Delete local file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("File deletion error:", err);
      }
    });

    // Create blog post
    const { title, body } = req.body;
    const blog = await Blog.create({
      body,
      title,
      createdBy: req.user._id,
      coverImageURL: result.secure_url,
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Failed to create blog post");
  }
});

module.exports = router;
