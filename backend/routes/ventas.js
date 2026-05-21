const express = require('express');
const router = express.Router();
const { getAll, getById, create } = require('../controllers/ventasController');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);

module.exports = router;
