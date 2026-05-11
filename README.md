# Chai Aur Backend

A comprehensive backend API for a video hosting platform similar to YouTube, built with Node.js, Express.js, MongoDB, and more. This project implements all essential features for a modern video platform, including user authentication, video uploads, likes, comments, subscriptions, and more.

## Features

- **User Authentication**: Secure login/signup with JWT tokens (access and refresh tokens)
- **Video Management**: Upload, stream, and manage videos with Cloudinary integration
- **User Interactions**: Like/dislike videos, comments, replies, and subscriptions
- **Dashboard**: Analytics and user-specific data
- **Rate Limiting**: Protection against abuse with middleware
- **File Uploads**: Multer middleware for handling file uploads
- **Health Checks**: API health monitoring
- **Docker Support**: Containerized deployment for easy setup
- **Comprehensive Testing**: Integration and unit tests

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), bcrypt for password hashing
- **File Storage**: Cloudinary for media uploads
- **Middleware**: Custom middlewares for auth, rate limiting, file uploads
- **Testing**: Mocha/Chai for API tests, database tests
- **Containerization**: Docker, Docker Compose
- **Deployment**: Render (production)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Docker (optional, for containerized setup)
- Cloudinary account for media storage

## Installation

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/videotube_backend.git
   cd videotube_backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `sample.env` to `.env`
   - Fill in the required values (see Environment Variables section below)

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Run the application**:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

### Docker Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/videotube_backend.git
   cd videotube_backend
   ```

2. **Set up environment variables**:
   - Create a `.env` file in the project root with the required variables (see below)

3. **Run with Docker**:
   ```bash
   docker run -it -p 3000:3000 --env-file .env coderdelta/videotube
   ```

   Or using Docker Compose (if available):
   ```bash
   docker-compose up
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/videotube
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Usage

Once the server is running, you can access the API at `http://localhost:3000` (or your configured port).

### API Endpoints

The API provides endpoints for:
- User management (register, login, profile)
- Video operations (upload, list, stream)
- Comments and replies
- Likes and dislikes
- Subscriptions
- Dashboard analytics

For detailed API documentation, import the Postman collection:
- [Postman Collection](https://coder-delta-7069445.postman.co/workspace/CRUD~bca99257-1145-4e7a-80b7-b466b7b03b3b/collection/48685006-be238b19-e035-4238-b265-6c12681b6c86?action=share&creator=48685006&active-environment=48685006-11560473-c1fa-4f3a-b7b6-d2e7a442b211)

## Testing

Run the test suite:

```bash
npm test
```

This includes:
- API integration tests
- Database connection tests
- Unit tests for utilities

## Project Structure

```
videotube_backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── index.js               # Server entry point
│   ├── constants.js           # Application constants
│   ├── controllers/           # Route controllers
│   ├── db/                    # Database connection
│   ├── middlewares/           # Custom middlewares
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   └── utils/                 # Utility functions
├── test/                      # Test files
├── public/temp/               # Temporary file storage
├── postman/                   # Postman collections
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Model Diagram

View the complete system architecture and database relationships:
- [Model Diagram (Eraser)](https://app.eraser.io/workspace/cVKAxuwbqqOZtOM0wwzX?origin=share)

## Deployment

The application is deployed on Render:
- [Production Backend](https://chai-aur-backend-tib4.onrender.com)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built following best practices for Node.js backend development
- Inspired by modern video platforms
- Uses industry-standard libraries and patterns

