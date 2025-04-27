import { successResponse, errorResponse } from "../utils/ApiResponse.util.js";
import Post from "../models/post.model.js";
import slugify from "slugify";

export const createPost = async (req, res) => {
  const { title, content, coverImage, tags, category } = req.body;

  const author = req.user._id; // Assuming you have user info in req.user
  const published = false; // Default to false when creating a post
  const publishedAt = null; // Default to null when creating a post

  if (!title || !slug || !content) {
    return errorResponse(res, 400, "Title, slug, and content are required");
  }

  const slug = slugify(title, { lower: true, strict: true });

  try {
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      return errorResponse(res, 400, "A post with this slug already exists");
    }

    const newPost = new Post({
      title,
      slug,
      content,
      coverImage,
      author,
      tags,
      category,
      published,
      publishedAt,
    });

    await newPost.save();

    return successResponse(res, 201, "Post created successfully", newPost);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email username profilePicture")
      .sort({ createdAt: -1 });
    return successResponse(res, 200, "Posts retrieved successfully", posts);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email username profilePicture")
      .populate("comments.author", "name email username profilePicture")
      .sort({ createdAt: -1 });
    if (!post) {
      return errorResponse(res, 404, "Post not found");
    }
    return successResponse(res, 200, "Post retrieved successfully", post);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params; // post ID from URL
  const { title, content, coverImage, tags, category, published } = req.body;
  const author = req.user._id;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return errorResponse(res, 404, "Post not found");
    }

    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this post." });
    }

    if (title) {
      post.title = title;
      post.slug = slugify(title, { lower: true, strict: true });
    }
    if (content) post.content = content;
    if (coverImage) post.coverImage = coverImage;
    if (tags) post.tags = tags;
    if (category) post.category = category;
    if (typeof published === "boolean") {
      post.published = published;
      post.publishedAt = published ? new Date() : null;
    }

    await post.save();

    return successResponse(res, 200, "Post updated successfully", post);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return errorResponse(res, 404, "Post not found");
    }
    return successResponse(res, 200, "Post deleted successfully", post);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};
