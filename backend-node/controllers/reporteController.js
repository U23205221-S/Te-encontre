const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const reportesFile = path.join(__dirname, '../data/reportes.json');

// Función auxiliar para leer los reportes
const readReportes = () => {
    try {
        const data = fs.readFileSync(reportesFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Función auxiliar para escribir reportes
const writeReportes = (reportes) => {
    fs.writeFileSync(reportesFile, JSON.stringify(reportes, null, 2));
};

exports.crearReporte = (req, res) => {
    try {
        const _foto = req.file ? req.file.filename : null;
        
        const nuevoReporte = {
            id: uuidv4(),
            ...req.body,
            foto: _foto,
            fechaCreacion: new Date().toISOString()
        };

        const reportes = readReportes();
        reportes.push(nuevoReporte);
        writeReportes(reportes);

        res.status(201).json({
            mensaje: 'Reporte creado exitosamente',
            reporte: nuevoReporte
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el reporte', error: error.message });
    }
};

exports.obtenerReporte = (req, res) => {
    try {
        const { id } = req.params;
        const reportes = readReportes();
        const reporte = reportes.find(r => r.id === id);

        if (!reporte) {
            return res.status(404).json({ mensaje: 'Reporte no encontrado' });
        }

        res.status(200).json(reporte);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el reporte', error: error.message });
    }
};

