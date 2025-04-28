import { successResponse, errorResponse } from "../utils/ApiResponse.util.js";
import Post from "../models/post.model.js";
import Comment from "../models/comments.model.js";
import slugify from "slugify";
import {
  cloudinaryUpload,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";

export const createPost = async (req, res) => {
  const { title, content, tags, category } = req.body;

  const author = req.user.id;

  const coverImage = req.file ? req.file.path : null;

  if (!coverImage) {
    return errorResponse(res, null, "Cover image is required", 400);
  }

  const imageUploadResult = await cloudinaryUpload(coverImage);
  if (imageUploadResult.error) {
    return errorResponse(res, null, imageUploadResult.error.message, 400);
  }

  const imageUrl = imageUploadResult.secure_url;
  const imagePublicId = imageUploadResult.public_id;

  const published = false; // Default to false when creating a post
  const publishedAt = null; // Default to null when creating a post

  const slug = slugify(title, { lower: true, strict: true });

  if (!title || !slug || !content) {
    return errorResponse(res, null, "Title, slug, and content are required");
  }

  try {
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      return errorResponse(res, null, "A post with this slug already exists");
    }

    const newPost = new Post({
      title,
      slug,
      content,
      coverImage: imageUrl,
      coverImagePublicId: imagePublicId,
      author,
      tags,
      category,
      published,
      publishedAt,
    });

    await newPost.save();

    return successResponse(res, newPost, "Post created successfully", 201);
  } catch (error) {
    // If there's an error during post creation, delete the uploaded image from Cloudinary
    if (imagePublicId) {
      await deleteFileFromCloudinary(imagePublicId);
    }
    return errorResponse(res, error, error.message);
  }
};

export const getPosts = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming the user is authenticated, and their ID is stored in the request (e.g., from a JWT)

    // Get posts
    const posts = await Post.find()
      .populate("author", "name email username profilePicture")
      .sort({ createdAt: -1 });

    // If no posts found, return error
    if (!posts || posts.length === 0) {
      return errorResponse(res, null, "No posts found", 404);
    }

    // Filter posts
    const filteredPosts = posts
      .map((post) => {
        if (post.author.toString() === userId.toString() || post.published) {
          // Show all posts for the author or if the post is published
          const { views, ...restOfPost } = post.toObject(); // Remove views field
          return restOfPost;
        }
        // If the user is not the author and post is not published, hide the post
        return null;
      })
      .filter((post) => post !== null); // Remove null values (non-published posts for non-authors)

    // Return filtered posts
    return successResponse(
      res,
      filteredPosts,
      "Posts retrieved successfully",
      200
    );
  } catch (error) {
    return errorResponse(res, error.message, "Internal Server Error", 500);
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email username profilePicture")
      .sort({ createdAt: -1 });
    if (!post) {
      return errorResponse(res, null, "Post not found", 404);
    }
    // Increment the view count if the post is published
    if (post.published) {
      post.views += 1;
      await post.save();
    }

    // Check if the post is published or if the user is the author
    if (
      !post.published &&
      post.author._id.toString() !== req.user.id.toString()
    ) {
      return errorResponse(res, null, "Post not found", 404);
    }

    const postId = post._id.toString(); // Get the post ID
    const comments = await Comment.find({ post: postId })
      .populate("user", "profilePicture name username")
      .sort({ createdAt: -1 })
      .lean();
    console.log(comments);

    const finalPost = post.toObject(); // Convert Mongoose document to plain object
    finalPost.comments = comments; // Add comments to the post object

    return successResponse(res, finalPost, "Post retrieved successfully", 200);
  } catch (error) {
    return errorResponse(res, error.message, "Internal Server Error", 500);
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params; // post ID from URL
  const { title, content, coverImage, tags, category, published } = req.body;

  const userId = req.user.id; // user ID from token
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
