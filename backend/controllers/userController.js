const firebase = require('../firebaseAdmin');

/**
 * Get All Users
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        const db = firebase.db;
        const snapshot = await db.collection('users').get();

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Update User Role
 * PUT /api/users/:id/role
 */
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role, hostelType } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }

    try {
        const db = firebase.db;
        const userRef = db.collection('users').doc(id);

        // Prevent modifying the main admin
        const userDoc = await userRef.get();
        if (userDoc.exists && userDoc.data().email === 'mathupriya2006@gmail.com') {
            return res.status(403).json({ error: 'Cannot modify the main admin account.' });
        }

        await userRef.update({
            role,
            hostelType: hostelType || null,
            updatedAt: new Date().toISOString()
        });

        // Also update custom claims in Firebase Auth if needed (optional but good for security)
        await firebase.admin.auth().setCustomUserClaims(id, { role });

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

/**
 * Delete User
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const db = firebase.db;
        const userRef = db.collection('users').doc(id);

        // Prevent deleting the main admin
        const userDoc = await userRef.get();
        if (userDoc.exists && userDoc.data().email === 'mathupriya2006@gmail.com') {
            return res.status(403).json({ error: 'Cannot delete the main admin account.' });
        }

        // Delete from Firestore
        await userRef.delete();

        // Delete from Firebase Auth
        await firebase.admin.auth().deleteUser(id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

module.exports = {
    getAllUsers,
    updateUserRole,
    deleteUser
};
