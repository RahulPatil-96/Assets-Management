const supabase = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create inventory item
const createItem = async (req, res) => {
  const { 
    name, 
    description, 
    lab, 
    issue, 
    current_status, 
    category,
    make,
    serial_number,
    purchase_date,
    purchase_cost,
    condition_status,
    warranty_expiry,
    status
  } = req.body;

  // Format date fields if they exist
  const formattedPurchaseDate = purchase_date ? new Date(purchase_date) : null;
  const formattedWarrantyExpiry = warranty_expiry ? new Date(warranty_expiry) : null;

  try {
    const item_id = uuidv4();

    const { data, error } = await supabase
      .from('inventory')
      .insert([
        { 
          item_id, 
          name, 
          description, 
          lab, 
          issue, 
          current_status: status || current_status, 
          category,
          make,
          serial_number,
          purchase_date: formattedPurchaseDate,
          purchase_cost,
          condition_status,
          warranty_expiry: formattedWarrantyExpiry
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
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
  const { 
    name, 
    description, 
    lab, 
    issue, 
    current_status, 
    category,
    make,
    serial_number,
    purchase_date,
    purchase_cost,
    condition_status,
    warranty_expiry,
    status
  } = req.body;

  // Format date fields if they exist
  const formattedPurchaseDate = purchase_date ? new Date(purchase_date) : null;
  const formattedWarrantyExpiry = warranty_expiry ? new Date(warranty_expiry) : null;

  try {
    // First get the existing item to ensure it exists
    const { data: existingData, error: existingError } = await supabase
      .from('inventory')
      .select('*')
      .eq('item_id', id)
      .single();

    if (existingError) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update the item
    const { data, error } = await supabase
      .from('inventory')
      .update({ 
        name, 
        description, 
        lab, 
        issue, 
        current_status: status || current_status, 
        category,
        make,
        serial_number,
        purchase_date: formattedPurchaseDate,
        purchase_cost,
        condition_status,
        warranty_expiry: formattedWarrantyExpiry
      })
      .eq('item_id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
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
      .eq('item_id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Item deleted', data });
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
