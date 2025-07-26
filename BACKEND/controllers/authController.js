const bcrypt = require('bcryptjs');
const supabase = require('../db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

// Signup user
const signup = async (req, res) => {
  const { name, role, password } = req.body;

  if (!['lab_assistant', 'assistant professor', 'hod'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const user_id = uuidv4();

    const hashedPassword = await hashPassword(password);

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ user_id, name, role, password: hashedPassword }]);

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: error.message, details: error });
      }

      res.status(201).json({ user_id, name, role });
    } catch (fetchError) {
      console.error('Fetch error during supabase insert:', fetchError);
      return res.status(500).json({ error: 'Fetch error during supabase insert', details: fetchError.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const signin = async (req, res) => {
  const { name, password } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = data;

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { signup, signin };