import User from "../models/user.model";
import { successResponse, errorResponse } from "../utils/ApiResponse.util.js";
import Post from "../models/post.model.js";

export const addToFavourites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!post) {
      return errorResponse(res, null, "Post not found", 404);
    }

    const alreadyFavorited = user.favorites.includes(postId);

    if (alreadyFavorited) {
      user.favorites.pull(postId);
    } else {
      user.favorites.push(postId);
    }

    await user.save();

    return successResponse(
      res,
      user.favorites,
      alreadyFavorited ? "Removed from favorites" : "Added to favorites",
      200
    );
  } catch (error) {
    return errorResponse(res, error, "Internal Server Error", 500);
  }
};
