const express = require('express');
const router = express.Router();
const { getDashboard, reporteCobros, reporteLotes, reporteCliente, reporteMorosos } = require('../controllers/reportesController');

router.get('/dashboard', getDashboard);
router.get('/cobros', reporteCobros);
router.get('/lotes', reporteLotes);
router.get('/morosos', reporteMorosos);
router.get('/cliente/:id', reporteCliente);

module.exports = router;
