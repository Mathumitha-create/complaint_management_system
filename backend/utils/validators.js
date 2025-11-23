/**
 * Validates the complaint creation payload
 * @param {Object} data - The request body
 * @returns {string|null} - Error message or null if valid
 */
const validateComplaint = (data) => {
    const requiredFields = [
        'studentId',
        'studentName',
        'studentEmail',
        'registerNumber',
        'category',
        'description',
        'hostelType',
        'resolutionTime'
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            return `Missing required field: ${field}`;
        }
    }

    // Normalize hostelType
    const type = (data.hostelType || '').toLowerCase();

    // Only strictly enforce if category is Hostel
    if (data.category === 'Hostel') {
        if (!type.includes('boys') && !type.includes('girls')) {
            return 'For Hostel category, hostelType must be "boys" or "girls".';
        }
    } else {
        // For other categories, if hostelType is provided but invalid, just default or warn?
        // We'll allow it, but maybe ensure it maps to something valid for email routing if needed.
        // For now, just pass if it's not Hostel category.
    }

    return null;
};

module.exports = {
    validateComplaint
};
