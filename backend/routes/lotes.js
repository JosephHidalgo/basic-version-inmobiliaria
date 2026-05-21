const express = require('express');
const router = express.Router();
const { getByProyecto, getById, create, update, remove } = require('../controllers/lotesController');

router.get('/proyecto/:proyectoId', getByProyecto);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
