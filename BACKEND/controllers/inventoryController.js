const supabase = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create inventory item with enhanced fields
const createItem = async (req, res) => {
  const { 
    name, 
    description, 
    lab, 
    issue, 
    current_status, 
    category,
    make,
    model,
    serial_number,
    asset_tag,
    barcode,
    qr_code,
    purchase_date,
    purchase_cost,
    purchase_order,
    vendor,
    condition_status,
    warranty_expiry,
    warranty_provider,
    building,
    department,
    room,
    floor,
    custodian,
    assigned_to,
    specifications,
    photos,
    documents,
    tags,
    notes
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
          current_status: current_status || 'active', 
          category,
          make,
          model,
          serial_number,
          asset_tag,
          barcode,
          qr_code,
          purchase_date: formattedPurchaseDate,
          purchase_cost: purchase_cost || 0,
          purchase_order,
          vendor,
          condition_status: condition_status || 'good',
          warranty_expiry: formattedWarrantyExpiry,
          warranty_provider,
          building,
          department,
          room,
          floor,
          custodian,
          assigned_to,
          specifications: specifications || {},
          photos: photos || [],
          documents: documents || [],
          tags: tags || [],
          notes: notes || '',
          created_by: req.user?.user_id || 'system',
          updated_by: req.user?.user_id || 'system'
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Server error creating item:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all items with enhanced filtering
const getItems = async (req, res) => {
  try {
    let query = supabase
      .from('inventory')
      .select('*');

    // Add filtering based on query parameters
    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }
    if (req.query.status) {
      query = query.eq('current_status', req.query.status);
    }
    if (req.query.department) {
      query = query.eq('department', req.query.department);
    }
    if (req.query.building) {
      query = query.eq('building', req.query.building);
    }
    if (req.query.room) {
      query = query.eq('room', req.query.room);
    }
    if (req.query.custodian) {
      query = query.eq('custodian', req.query.custodian);
    }
    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,serial_number.ilike.%${req.query.search}%,asset_tag.ilike.%${req.query.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Server error fetching items:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get item by ID with full details
const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('item_id', id)
      .single();

    if (error) {
      console.error('Error fetching item by ID:', error);
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Server error fetching item by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update item with enhanced fields
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
    model,
    serial_number,
    asset_tag,
    barcode,
    qr_code,
    purchase_date,
    purchase_cost,
    purchase_order,
    vendor,
    condition_status,
    warranty_expiry,
    warranty_provider,
    building,
    department,
    room,
    floor,
    custodian,
    assigned_to,
    specifications,
    photos,
    documents,
    tags,
    notes
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
        current_status: current_status || 'active', 
        category,
        make,
        model,
        serial_number,
        asset_tag,
        barcode,
        qr_code,
        purchase_date: formattedPurchaseDate,
        purchase_cost: purchase_cost || 0,
        purchase_order,
        vendor,
        condition_status: condition_status || 'good',
        warranty_expiry: formattedWarrantyExpiry,
        warranty_provider,
        building,
        department,
        room,
        floor,
        custodian,
        assigned_to,
        specifications: specifications || {},
        photos: photos || [],
        documents: documents || [],
        tags: tags || [],
        notes: notes || '',
        updated_by: req.user?.user_id || 'system'
      })
      .eq('item_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Server error updating item:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete item
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
      console.error('Error deleting item:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Item deleted successfully', data });
  } catch (err) {
    console.error('Server error deleting item:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get items summary statistics
const getItemsSummary = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('current_status, category, department, condition_status');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const summary = {
      total: data.length,
      byStatus: {},
      byCategory: {},
      byDepartment: {},
      byCondition: {}
    };

    data.forEach(item => {
      summary.byStatus[item.current_status] = (summary.byStatus[item.current_status] || 0) + 1;
      summary.byCategory[item.category] = (summary.byCategory[item.category] || 0) + 1;
      summary.byDepartment[item.department] = (summary.byDepartment[item.department] || 0) + 1;
      summary.byCondition[item.condition_status] = (summary.byCondition[item.condition_status] || 0) + 1;
    });

    res.json(summary);
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
  getItemsSummary
};
