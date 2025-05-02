import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // For SEO URLs
    content: { type: String, required: true },
    coverImage: { type: String }, // optional blog thumbnail
    coverImagePublicId: { type: String }, // optional blog thumbnail public id for cloudinary
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    credits: { type: Number, default: 5 }, // optional credits field
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String }], // optional tags
    category: { type: String }, // optional category field
    published: { type: Boolean, default: false },
    publishedAt: { type: Date }, // when published
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
