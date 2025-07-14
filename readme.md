# Full-Stack Blog Backend

This repository contains the backend implementation for a full-stack blog application. The backend is built using modern technologies to provide a robust and scalable API for managing blog posts, user authentication, and other features.

---

## Features

- **User Authentication**: Secure user registration, login, and session management.
- **CRUD Operations**: Create, read, update, and delete blog posts.
- **Commenting System**: Allow users to comment on blog posts.
- **Database Integration**: Persistent storage using a relational or NoSQL database.
- **API Documentation**: Well-documented RESTful API endpoints.
- **Error Handling**: Comprehensive error handling for a seamless user experience.

---

## Technologies Used

- **Node.js**: JavaScript runtime for building the backend.
- **Express.js**: Web framework for creating RESTful APIs.
- **Database**: MongoDB, PostgreSQL, or MySQL (choose based on your setup).
- **Authentication**: JSON Web Tokens (JWT) for secure authentication.
- **Environment Variables**: Managed using `dotenv` for configuration.

---

## Getting Started

### Prerequisites

- Node.js installed on your machine.
- A database instance (e.g., MongoDB).
- A package manager like `npm` or `yarn`.

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/talhabilal-dev/devnest.git
   cd devnest
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and configure the following:

   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.m8oca.mongodb.net/<db_name>?retryWrites=true&w=majority&appName=Cluster0
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ACCESS_TOKEN_SECRET=your_access_token_secret
   CLIENT_URL="*"
   CLOUDINARY_URL=cloudinary://<cloudinary_api_key>:<cloudinary_api_secret>@<cloudinary_cloud_name>
   CLOUDINARY_CLOUD_NAME=<cloudinary_cloud_name>
   CLOUDINARY_API_KEY=<cloudinary_api_key>
   CLOUDINARY_API_SECRET=<cloudinary_api_secret>
   NODE_ENV=production
   RESEND_API_KEY=your_resend_api_key
   VERIFICATION_TOKEN_SECRET=your_verification_token_secret
   PASSWORD_RESET_TOKEN_SECRET=your_password_reset_token_secret
   EMAIL_FROM=your_email_from_address
   ```

---

### Running the Application

Start the development server:

```bash
npm run dev
```

The server will be running at `http://localhost:<PORT>`.

### API Endpoints

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| GET    | `/api/posts`     | Fetch all blog posts     |
| POST   | `/api/posts`     | Create a new blog post   |
| GET    | `/api/posts/:id` | Fetch a single blog post |
| PUT    | `/api/posts/:id` | Update a blog post       |
| DELETE | `/api/posts/:id` | Delete a blog post       |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or feedback, please reach out to [contact@talhabilal.dev].
