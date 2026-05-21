const express = require('express');
const router = express.Router();
const { create, getByCuota, getRecibo, getAll } = require('../controllers/pagosController');

router.get('/', getAll);
router.get('/cuota/:cuotaId', getByCuota);
router.get('/:id/recibo', getRecibo);
router.post('/', create);

module.exports = router;
