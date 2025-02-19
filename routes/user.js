import express from 'express';
import { createUser, update, deleteUser, findUser, getUser, getNotifications, getWorks, getTasks, subscribe, unsubscribe, getUserProjects, getUserTeams, findUserByEmail } from '../controllers/userController.js';

const router = express.Router();

// Create User
router.post('/users', createUser);

// Update User
router.put('/users/:id', update);

// Delete User
router.delete('/users/:id', deleteUser);

// Find User by ID
router.get('/users/:id', findUser);

// Get User Profile
router.get('/users/me', getUser); // Protected route for logged-in user

// Get Notifications
router.get('/users/notifications', getNotifications);

// Get User's Works
router.get('/users/works', getWorks);

// Get User's Tasks
router.get('/users/tasks', getTasks);

// Subscribe User
router.post('/users/subscribe/:id', subscribe);

// Unsubscribe User
router.post('/users/unsubscribe/:id', unsubscribe);

// Get User's Projects
router.get('/users/projects', getUserProjects);

// Get User's Teams
router.get('/users/teams', getUserTeams);

// Find User by Email
router.get('/users/email/:email', findUserByEmail);

export default router;
