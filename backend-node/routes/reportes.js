const express = require('express');
const router = express.Router();
const multer = require('multer');
const { crearReporte, obtenerReporte } = require('../controllers/reporteController');

// Configuración de Multer para la subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage: storage });

// Rutas
router.get('/', (req, res) => {
    res.send('La API de reportes funciona correctamente');
});
router.post('/', upload.single('foto'), crearReporte);
router.get('/:id', obtenerReporte);

module.exports = router;
