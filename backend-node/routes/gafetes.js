const express = require('express');
const router = express.Router();
const multer = require('multer');
const { crearGafete, obtenerGafete } = require('../controllers/gafeteController');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'gafete-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage: storage });

router.post('/', upload.single('foto'), crearGafete);
router.get('/:id', obtenerGafete);

module.exports = router;
