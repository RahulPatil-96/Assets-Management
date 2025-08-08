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

  // Validate role
  const validRoles = ['lab_assistant', 'assistant professor', 'hod', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Validate password
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const user_id = uuidv4();
    const hashedPassword = await hashPassword(password);
    
    // Generate email from name (or use provided email if available)
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@temp.com`;

    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        user_id, 
        name: name.trim(), 
        email, 
        role, 
        password: hashedPassword 
      }])
      .select('user_id, name, role')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Handle duplicate email/name errors
      if (error.code === '23505') {
        return res.status(409).json({ message: 'User already exists' });
      }
      
      return res.status(500).json({ message: 'Failed to create user', error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
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