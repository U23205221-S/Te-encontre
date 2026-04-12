const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const gafetesFile = path.join(__dirname, '../data/gafetes.json');

const readGafetes = () => {
    try {
        const data = fs.readFileSync(gafetesFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeGafetes = (gafetes) => {
    fs.writeFileSync(gafetesFile, JSON.stringify(gafetes, null, 2));
};

exports.crearGafete = (req, res) => {
    try {
        const _foto = req.file ? req.file.filename : null;
        
        const nuevoGafete = {
            id: uuidv4(),
            ...req.body,
            foto: _foto,
            fechaCreacion: new Date().toISOString()
        };

        const gafetes = readGafetes();
        gafetes.push(nuevoGafete);
        writeGafetes(gafetes);

        res.status(201).json({
            mensaje: 'Gafete creado exitosamente',
            gafete: nuevoGafete
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el gafete', error: error.message });
    }
};

exports.obtenerGafete = (req, res) => {
    try {
        const { id } = req.params;
        const gafetes = readGafetes();
        const gafete = gafetes.find(r => r.id === id);

        if (!gafete) {
            return res.status(404).json({ mensaje: 'Gafete no encontrado' });
        }

        res.status(200).json(gafete);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el gafete', error: error.message });
    }
};
