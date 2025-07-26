const supabase = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create inventory item
const createItem = async (req, res) => {
  const { name, invoice_no, description, lab, issue, current_status, photo_url } = req.body;

  try {
    const item_id = uuidv4();

    const { data, error } = await supabase
      .from('inventory')
      .insert([
        { item_id, name, invoice_no, description, lab, issue, current_status, photo_url },
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ item_id, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('item_id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, invoice_no, description, lab, issue, current_status, photo_url } = req.body;

  try {
    const { data, error } = await supabase
      .from('inventory')
      .update({ name, invoice_no, description, lab, issue, current_status, photo_url })
      .eq('item_id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Item updated', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('inventory')
      .delete()
      .eq('item_id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};