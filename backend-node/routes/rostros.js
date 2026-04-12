const express = require('express');
const router = express.Router();
const { registrarRostro, buscarRostro } = require('../controllers/rostroController');

router.post('/registrar', registrarRostro);
router.post('/buscar', buscarRostro);

module.exports = router;
