import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // For SEO URLs
    content: { type: String, required: true },
    coverImage: { type: String }, // optional blog thumbnail
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String }], // optional tags
    category: { type: String }, // optional category field
    published: { type: Boolean, default: false },
    publishedAt: { type: Date }, // when published
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
