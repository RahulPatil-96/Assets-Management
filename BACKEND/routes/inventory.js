const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/inventoryController');

router.post('/', authenticate, createItem);

router.get('/', authenticate, getItems);

router.get('/:id', authenticate, getItemById);

router.put('/:id', authenticate, updateItem);

router.delete('/:id', authenticate, deleteItem);

module.exports = router;
