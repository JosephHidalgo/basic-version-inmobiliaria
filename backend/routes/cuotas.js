const express = require('express');
const router = express.Router();
const { getByVenta, getPendientes, updateMora } = require('../controllers/cuotasController');

router.get('/pendientes', getPendientes);
router.get('/venta/:ventaId', getByVenta);
router.put('/:id/mora', updateMora);

module.exports = router;
