const { Router } = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
require("dotenv").config();

const Blog = require("../models/blog");
const Comment = require("../models/comments");
const router = Router();

// Cloudinary configuration using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer to store files in memory
const storage = multer.memoryStorage();
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
    // Stream the file buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "blogs" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
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
