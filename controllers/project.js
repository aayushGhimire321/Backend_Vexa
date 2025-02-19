import mongoose from "mongoose";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Works from "../models/Works.js";
import Tasks from "../models/Tasks.js";
import Notifications from "../models/Notifications.js";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createError } from "../error.js";

// Load environment variables from .env file
dotenv.config();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  port: 465,
  host: "smtp.gmail.com",
});

// Add Project
export const addProject = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(createError(404, "User not found"));
  }

  const newProject = new Project({
    members: [
      {
        id: user.id,
        img: user.img,
        email: user.email,
        name: user.name,
        role: "d",
        access: "Owner",
      },
    ],
    ...req.body,
  });

  try {
    const savedProject = await newProject.save();
    await User.findByIdAndUpdate(user.id, { $push: { projects: savedProject._id } }, { new: true });
    res.status(200).json(savedProject);
  } catch (err) {
    next(err);
  }
};

// Delete Project
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found"));

    const isOwner = project.members.some(
      (member) => member.id.toString() === req.user.id && member.access === "Owner"
    );
    if (isOwner) {
      await project.delete();
      await User.findByIdAndUpdate(req.user.id, { $pull: { projects: req.params.id } }, { new: true });
      project.members.forEach(async (member) => {
        await User.findByIdAndUpdate(member.id, { $pull: { projects: req.params.id } }, { new: true });
      });
      res.status(200).json("Project has been deleted");
    } else {
      return next(createError(403, "You are not allowed to delete this project"));
    }
  } catch (err) {
    next(err);
  }
};

// Get Project
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate("members.id", "_id name email img");
    const isMember = project.members.some((member) => member.id.toString() === req.user.id);
    if (isMember) {
      res.status(200).json(project);
    } else {
      return next(createError(403, "You are not allowed to view this project"));
    }
  } catch (err) {
    next(err);
  }
};

// Update Project
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found"));

    const isAuthorized = project.members.some(
      (member) => member.id.toString() === req.user.id && ["Owner", "Admin", "Editor"].includes(member.access)
    );

    if (isAuthorized) {
      const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json({ message: "Project has been updated" });
    } else {
      return next(createError(403, "You are not allowed to update this project"));
    }
  } catch (err) {
    next(err);
  }
};

// Update Project Members
export const updateMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found"));

    const isAuthorized = project.members.some(
      (member) => member.id.toString() === req.user.id && ["Owner", "Admin", "Editor"].includes(member.access)
    );

    if (isAuthorized) {
      await Project.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            "members.$[elem].access": req.body.access,
            "members.$[elem].role": req.body.role,
          },
        },
        {
          arrayFilters: [{ "elem.id": req.body.id }],
          new: true,
        }
      );
      res.status(200).json({ message: "Member has been updated" });
    } else {
      return next(createError(403, "You are not allowed to update this project"));
    }
  } catch (err) {
    next(err);
  }
};

// Remove Project Member
export const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found"));

    const isAuthorized = project.members.some(
      (member) => member.id.toString() === req.user.id && ["Owner", "Admin", "Editor"].includes(member.access)
    );

    if (isAuthorized) {
      await Project.findByIdAndUpdate(
        req.params.id,
        { $pull: { members: { id: req.body.id } } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        req.body.id,
        { $pull: { projects: req.params.id } },
        { new: true }
      );
      res.status(200).json({ message: "Member has been removed" });
    } else {
      return next(createError(403, "You are not allowed to remove members from this project"));
    }
  } catch (err) {
    next(err);
  }
};

// Invite Project Member
export const inviteProjectMember = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(createError(404, "User not found"));

  const project = await Project.findById(req.params.id);
  if (!project) return next(createError(404, "Project not found"));

  const inviteCode = otpGenerator.generate(8, {
    upperCaseAlphabets: true,
    specialChars: true,
    lowerCaseAlphabets: true,
    digits: true,
  });

  const link = `${process.env.URL}/projects/invite/${inviteCode}?projectid=${req.params.id}&userid=${req.body.id}&access=${req.body.access}&role=${req.body.role}`;

  const mailBody = `...`; // same email body as before

  const isAuthorized = project.members.some(
    (member) => member.id.toString() === req.user.id && ["Owner", "Admin", "Editor"].includes(member.access)
  );

  if (isAuthorized) {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: req.body.email,
      subject: `Invitation to join project ${project.title}`,
      html: mailBody,
    };

    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        return next(err);
      } else {
        return res.status(200).json({ message: "Invitation sent successfully" });
      }
    });
  } else {
    return next(createError(403, "You are not allowed to invite members to this project"));
  }
};

// Verify Invitation
export const verifyInvitation = async (req, res, next) => {
  const { projectid, userid, access, role } = req.query;
  const code = req.params.code;

  if (code === req.app.locals.CODE) {
    req.app.locals.CODE = null;
    const project = await Project.findById(projectid);
    if (!project) return next(createError(404, "Project not found"));

    const user = await User.findById(userid);
    if (!user) return next(createError(404, "User not found"));

    if (project.members.some((member) => member.id.toString() === user.id.toString())) {
      return next(createError(403, "You are already a member of this project"));
    }

    const newMember = { id: user.id, role, access };
    await Project.findByIdAndUpdate(
      projectid,
      { $push: { members: newMember } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      user.id,
      { $push: { projects: project._id } },
      { new: true }
    );

    res.status(200).json({ message: "Successfully joined the project" });
  } else {
    res.status(201).json({ message: "Invalid or expired invitation link" });
  }
};

// Get Project Members
export const getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found"));
    res.status(200).json(project.members);
  } catch (err) {
    next(err);
  }
};

// Add Work to Project
export const addWork = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(createError(404, "User not found"));

  const project = await Project.findById(req.params.id);
  if (!project) return next(createError(404, "Project not found"));

  const newWork = new Works({
    projectId: req.params.id,
    name: req.body.name,
    description: req.body.description,
    creatorId: user._id,
  });

  try {
    const savedWork = await newWork.save();
    res.status(200).json(savedWork);
  } catch (err) {
    next(err);
  }
};

// Get Works of a Project
export const getWorks = async (req, res, next) => {
  try {
    const works = await Works.find({ projectId: req.params.id });
    res.status(200).json(works);
  } catch (err) {
    next(err);
  }
};
