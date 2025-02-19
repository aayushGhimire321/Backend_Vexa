import jwt from "jsonwebtoken";
import { createError } from "../error.js";

export const verifyToken = async (req, res, next) => {
  try {
    // Check if authorization header is present
    if (!req.headers.authorization) {
      return next(createError(401, "You are not authenticated!"));
    }

    // Get the token from the authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Check if token exists
    if (!token) {
      return next(createError(401, "You are not authenticated!"));
    }

    // Verify the token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Respond with an error message
    return res.status(401).json({
      error: "Token verification failed, please login again."
    });
  }
};
