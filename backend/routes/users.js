const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to check if user is admin (basic check based on header/body for now, ideally should verify token)
// For simplicity in this iteration, we'll trust the frontend to send valid requests, 
// but in production, we should verify the Firebase ID token in the Authorization header.
const isAdmin = async (req, res, next) => {
    // TODO: Implement proper token verification middleware
    // For now, we'll proceed. The controller checks for critical actions (like deleting main admin).
    next();
};

router.get('/', isAdmin, userController.getAllUsers);
router.put('/:id/role', isAdmin, userController.updateUserRole);
router.delete('/:id', isAdmin, userController.deleteUser);

module.exports = router;
