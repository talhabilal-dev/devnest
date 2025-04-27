import Post from "../models/post.model.js";
import Comment from "../models/comments.model.js";
import { errorResponse, successResponse } from "../utils/ApiResponse.util.js";

export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return errorResponse(res, null, "Content is required", 400);
    }

    // Check if the Post exists
    const post = await Post.findById(postId);
    if (!post) {
      return errorResponse(res, null, "Post not found", 404);
    }

    // Create Comment
    const comment = await Comment.create({
      post: postId,
      user: req.user.id, // Assuming you attach user info in req.user
      content,
    });

    // Populate the comment with user info for frontend
    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name username profilePicture")
      .lean();

    return successResponse(
      res,
      populatedComment,
      "Comment created successfully",
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message, "Internal Server Error", 500);
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("user", "name username profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      comments,
      "Comments retrieved successfully",
      200
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message, "Internal Server Error", 500);
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse(res, null, "Comment not found", 404);
    }

    // Only author of comment can delete
    if (comment.user.toString() !== req.user.id.toString()) {
      return errorResponse(res, null, "Unauthorized", 403);
    }

    await Comment.findByIdAndDelete(commentId);

    return successResponse(res, null, "Comment deleted successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message, "Internal Server Error", 500);
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return errorResponse(res, null, "Content is required", 400);
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse(res, null, "Comment not found", 404);
    }

    // Only author of comment can edit
    if (comment.user.toString() !== req.user.id.toString()) {
      return errorResponse(res, null, "Unauthorized", 403);
    }

    comment.content = content;
    await comment.save();

    return successResponse(res, comment, "Comment updated successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message, "Internal Server Error", 500);
  }
};
