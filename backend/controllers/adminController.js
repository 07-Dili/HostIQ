const User = require('../models/User');
const Block = require('../models/Block');
const jwt = require('jsonwebtoken');

const createWarden = async (req, res) => {
  const { firstName, lastName, email, password, gender, phoneNumber, blockName } = req.body;
  
  if (!firstName || !lastName || !email || !password || !gender || !phoneNumber || !blockName) {
      return res.status(400).json({ message: 'Please provide all required fields for the Warden.' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Warden email already exists.' });
    }

    const blockAssigned = await Block.findOne({ blockName });
    if (blockAssigned) {
        return res.status(400).json({ message: `Block ${blockName} is already assigned to a warden.` });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      gender,
      phoneNumber,
      blockName,
      role: 'warden',
      year: 0,
      department: 'N/A'
    });

    if (user) {
      res.status(201).json({
        message: 'Warden created successfully',
        warden: {
          _id: user._id,
          firstName: user.firstName,
          email: user.email,
          blockName: user.blockName,
          role: user.role,
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid warden data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error during warden creation', error: error.message });
  }
};

const createBlock = async (req, res) => {
    const { blockName, capacity, gender, wardenEmail } = req.body;

    if (!blockName || !capacity || !gender || !wardenEmail) {
        return res.status(400).json({ message: 'Please provide blockName, capacity, gender, and wardenEmail.' });
    }

    try {
        const wardenUser = await User.findOne({ email: wardenEmail, role: 'warden' });

        if (!wardenUser) {
            return res.status(404).json({ message: `No warden found with email ${wardenEmail}.` });
        }
        
        const blockExists = await Block.findOne({ blockName: blockName.toUpperCase() });
        if (blockExists) {
            return res.status(400).json({ message: `Block ${blockName} is already registered.` });
        }
        
        const wardenAssigned = await Block.findOne({ warden: wardenUser._id });
        if (wardenAssigned) {
            return res.status(400).json({ message: `Warden ${wardenEmail} is already assigned to a block.` });
        }

        const block = await Block.create({
            blockName: blockName.toUpperCase(),
            capacity,
            gender,
            warden: wardenUser._id,
            wardenEmail
        });

        wardenUser.blockName = block.blockName;
        await wardenUser.save();

        res.status(201).json({ 
            message: `Block ${block.blockName} created and assigned to ${wardenEmail}.`,
            block 
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error during block creation', error: error.message });
    }
};

module.exports = { createWarden, createBlock };