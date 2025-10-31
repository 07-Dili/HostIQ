const User = require('../models/User');
const bcrypt = require('bcryptjs');


const checkStudentFields = (body) => {
    return body.firstName && body.lastName && body.email && body.password && body.year && body.department && body.phoneNumber && body.gender && body.roomNumber && body.blockName;
}

const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -fees -attendance');

    if (user) {
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            year: user.year,
            department: user.department,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            role: user.role,
            hobbies: user.hobbies,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        user.gender = req.body.gender || user.gender;
        user.hobbies = req.body.hobbies !== undefined ? user.hobbies : user.hobbies;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            year: updatedUser.year,
            department: updatedUser.department,
            phoneNumber: updatedUser.phoneNumber,
            gender: updatedUser.gender,
            role: updatedUser.role,
            hobbies: updatedUser.hobbies,
            blockName: updatedUser.blockName,
            roomNumber: updatedUser.roomNumber,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const getStudentDatabase = async (req, res) => {
    const { blockName } = req.query;

    const filter = { role: 'student' };

    if (req.user.role === 'warden' && req.user.blockName) {
        filter.$or = [
            { blockName: req.user.blockName },
            { blockName: { $in: [null, "", 0] } }
        ];
    } else if (blockName && blockName !== 'undefined') {
        filter.blockName = blockName;
    }

    try {
        const students = await User.find(filter)
            .select('-password -__v -token')
            .sort({ roomNumber: 1, firstName: 1 });

        const rooms = students.reduce((acc, student) => {
            const isAssignedToBlock = student.blockName && student.blockName !== "" && student.blockName !== 0;
            const isAssignedToRoom = student.roomNumber && student.roomNumber !== 0;

            const roomKey = (isAssignedToBlock && isAssignedToRoom) ? student.roomNumber : 'Unassigned';

            if (!acc[roomKey]) {
                acc[roomKey] = [];
            }
            acc[roomKey].push(student.toObject());
            return acc;
        }, {});

        res.json({
            blockName: req.user.blockName || 'Undefined',
            rooms: rooms,
            isWarden: req.user.role === 'warden'
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student database', error: error.message });
    }
};

const addStudent = async (req, res) => {
    const data = req.body;

    if (!checkStudentFields(data)) {
        return res.status(400).json({ message: 'Missing required student fields (roomNumber, blockName, etc.)' });
    }

    try {
        const studentExists = await User.findOne({ email: data.email });
        if (studentExists) {
            return res.status(400).json({ message: 'Student with this email already exists.' });
        }

        const newStudent = await User.create({ ...data, role: 'student' });

        res.status(201).json({ message: 'Student added successfully', studentId: newStudent._id });

    } catch (error) {
        res.status(500).json({ message: 'Failed to add student', error: error.message });
    }
};

const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { fees, attendance } = req.body;

    try {
        const student = await User.findById(id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (req.user.role === 'warden' && student.blockName !== req.user.blockName) {
            return res.status(403).json({ message: 'Unauthorized to edit students outside your block.' });
        }

        if (fees !== undefined) {
            student.fees = fees;
        }
        if (attendance) {
            student.attendance = attendance;
        }

        const updatedStudent = await student.save();
        res.json({ message: 'Student updated successfully', fees: updatedStudent.fees, attendance: updatedStudent.attendance });

    } catch (error) {
        res.status(500).json({ message: 'Failed to update student', error: error.message });
    }
};

const updateStudentRoom = async (req, res) => {
    const { id } = req.params;
    const { roomNumber, blockName } = req.body;

    try {
        const student = await User.findById(id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (req.user.role === 'warden') {
            const wardenBlock = req.user.blockName;
            const studentCurrentBlock = student.blockName;
            const newBlock = blockName;

            const isUnassigned = !studentCurrentBlock;
            const isInWardenBlock = studentCurrentBlock === wardenBlock;

            if (
                (isUnassigned && newBlock === wardenBlock) ||
                (isInWardenBlock && newBlock === wardenBlock)
            ) {

            } else {
                return res.status(403).json({ message: 'Unauthorized: Cannot assign students outside your block, or reassign students already in other blocks.' });
            }
        }

        student.roomNumber = roomNumber || null;
        student.blockName = blockName || null;

        await student.save();
        res.json({ message: 'Student room assignment updated successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to update student room', error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    const { id } = req.params;

    try {
        const student = await User.findById(id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'User not found or is not a student.' });
        }

        if (req.user.role === 'admin') {
            await student.deleteOne();
            return res.json({ message: 'Student permanently deleted by Admin.' });
        }

        student.roomNumber = null;
        student.blockName = null;
        await student.save();

        res.json({ message: 'Student un-assigned from room/block successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to delete student assignment', error: error.message });
    }
};

const updateBulkAttendance = async (req, res) => {
    const updates = req.body.updates;
    const blockName = req.user.blockName;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: 'No updates provided.' });
    }

    try {
        const operations = updates.map(u => ({
            updateOne: {
                filter: { _id: u.studentId, blockName: blockName, role: 'student' },
                update: { $set: { attendance: u.attendance } }
            }
        }));

        await User.bulkWrite(operations);

        res.json({ message: 'Attendance updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update bulk attendance', error: error.message });
    }
};

const updateBulkFees = async (req, res) => {
    const updates = req.body.updates;
    const blockName = req.user.blockName;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: 'No updates provided.' });
    }

    try {
        const operations = updates.map(u => ({
            updateOne: {
                filter: { _id: u.studentId, blockName: blockName, role: 'student' },
                update: { $set: { fees: u.fees } }
            }
        }));

        await User.bulkWrite(operations);

        res.json({ message: 'Fees status updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update bulk fees status', error: error.message });
    }
};

const getHobbyMatches = async (req, res) => {
    const { blockName, proposedHobbies } = req.body;

    if (!blockName || !proposedHobbies || proposedHobbies.length === 0) {
        return res.status(400).json({ message: 'Block name and at least one hobby are required for matching.' });
    }

    if (req.user.role === 'warden' && req.user.blockName !== blockName) {
        return res.status(403).json({ message: 'Unauthorized to query hobby matches outside your block.' });
    }

    try {
        const assignedStudents = await User.find({
            role: 'student',
            blockName: blockName,
            roomNumber: { $ne: null }
        }).select('roomNumber hobbies');

        const roomData = {};

        assignedStudents.forEach(student => {
            const room = student.roomNumber;
            const sharedHobbies = student.hobbies.filter(h => proposedHobbies.includes(h)).length;

            if (!roomData[room]) {
                roomData[room] = {
                    count: 0,
                    totalMatchScore: 0,
                    maxCapacity: 4,
                };
            }

            roomData[room].count += 1;
            roomData[room].totalMatchScore += sharedHobbies;
        });

        const matchedRooms = Object.keys(roomData)
            .filter(room => roomData[room].count < roomData[room].maxCapacity)
            .map(room => ({
                roomNumber: parseInt(room),
                currentStudents: roomData[room].count,
                averageMatchScore: roomData[room].totalMatchScore / roomData[room].count,
                totalMatchScore: roomData[room].totalMatchScore
            }))
            .sort((a, b) => b.averageMatchScore - a.averageMatchScore);

        res.json({ matchedRooms });

    } catch (error) {
        res.status(500).json({ message: 'Failed to find hobby matches', error: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getStudentDatabase,
    addStudent,
    updateStudent,
    updateStudentRoom,
    deleteStudent,
    updateBulkAttendance,
    updateBulkFees,
    getHobbyMatches,
};