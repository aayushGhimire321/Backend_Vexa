import bcrypt from 'bcryptjs';
import { createError } from "../error.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Teams from "../models/Teams.js";
import Notifications from "../models/Notifications.js";

// Create User function
export const createUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Ensure name, email, and password are provided
  if (!name || !email || !password) {
    return res.status(422).send({ message: "Name, email, and password are required." });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists with this email." });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,  // email is included here
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    next(err);
  }
};

// Update User
export const update = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,  // req.body will include the email if it needs to be updated
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can update only your account!"));
  }
};

// Delete User
export const deleteUser = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User has been deleted.");
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can delete only your account!"));
  }
};

// Find User by ID
export const findUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// Get User Profile (Authenticated)
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("notifications")
      .populate({
        path: "teams",
        populate: {
          path: "members.id",
          select: "_id name email",
        },
      })
      .populate("projects")
      .populate("works")
      .populate("tasks");

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// Get Notifications
export const getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const notifications = user.notifications;
    const notificationArray = [];
    for (let i = 0; i < notifications.length; i++) {
      const notification = await Notifications.findById(notifications[i]);
      notificationArray.push(notification);
    }
    res.status(200).json(notificationArray);
  } catch (err) {
    next(err);
  }
};

// Get Works
export const getWorks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "works",
      populate: {
        path: "tasks",
        populate: {
          path: "members",
          select: "name img",
        },
      },
    }).populate({
      path: "works",
      populate: {
        path: "creatorId",
        select: "name img",
      },
    }).sort({ updatedAt: -1 });

    if (!user) return next(createError(404, "User not found!"));

    const works = [];
    await Promise.all(
      user.works.map(async (work) => {
        works.push(work);
      })
    ).then(() => {
      res.status(200).json(works);
    });
  } catch (err) {
    next(err);
  }
};

// Get Tasks
export const getTasks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "tasks",
      populate: {
        path: "members",
        select: "name img",
      },
    }).sort({ end_date: 1 });

    if (!user) return next(createError(404, "User not found!"));

    const tasks = [];
    await Promise.all(
      user.tasks.map(async (task) => {
        tasks.push(task);
      })
    ).then(() => {
      res.status(200).json(tasks);
    });
  } catch (err) {
    next(err);
  }
};

// Subscribe User
export const subscribe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $push: { subscribedUsers: req.params.id },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $inc: { subscribers: 1 },
    });
    res.status(200).json("Subscription successful.");
  } catch (err) {
    next(err);
  }
};

// Unsubscribe User
export const unsubscribe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { subscribedUsers: req.params.id },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $inc: { subscribers: -1 },
    });
    res.status(200).json("Unsubscription successful.");
  } catch (err) {
    next(err);
  }
};

// Get User's Projects
export const getUserProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("projects");
    const projects = [];
    await Promise.all(
      user.projects.map(async (project) => {
        await Project.findById(project).populate("members.id", "_id name email img").then((project) => {
          projects.push(project);
        }).catch((err) => {
          next(err);
        });
      })
    ).then(() => {
      res.status(200).json(projects);
    }).catch((err) => {
      next(err);
    });
  } catch (err) {
    next(err);
  }
};

// Get User's Teams
export const getUserTeams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("teams");
    const teams = [];
    await Promise.all(
      user.teams.map(async (team) => {
        await Teams.findById(team.id).then((team) => {
          teams.push(team);
        }).catch((err) => {
          next(err);
        });
      })
    ).then(() => {
      res.status(200).json(teams);
    }).catch((err) => {
      next(err);
    });
  } catch (err) {
    next(err);
  }
};

// Find User by Email
export const findUserByEmail = async (req, res, next) => {
  const email = req.params.email;

  try {
    const user = await User.findOne({ email: { $regex: email, $options: "i" } }); // Case-insensitive match
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "No user found with this email." });
    }
  } catch (err) {
    next(err);
  }
};
