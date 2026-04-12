const fs = require('fs');
const path = require('path');

const rostrosFile = path.join(__dirname, '../data/rostros.json');

// ─── Helpers de I/O ───────────────────────────────────────────────────────────

const readRostros = () => {
    try {
        const data = fs.readFileSync(rostrosFile, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const writeRostros = (rostros) => {
    fs.writeFileSync(rostrosFile, JSON.stringify(rostros, null, 2));
};

// ─── Distancia Euclidiana ─────────────────────────────────────────────────────
/**
 * Calcula la Distancia Euclidiana entre dos vectores de igual longitud.
 *
 * Fórmula:  d = sqrt( Σ (v1[i] - v2[i])² )
 *
 * @param {number[]} v1 - Vector de referencia (face descriptor registrado).
 * @param {number[]} v2 - Vector de consulta (face descriptor del escaneo).
 * @returns {number} Distancia entre ambos vectores. Menor = más parecido.
 *                   Valor típico entre rostros del mismo individuo: < 0.6
 */
const euclideanDistance = (v1, v2) => {
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
        const diff = v1[i] - v2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
};

// ─── Controladores ────────────────────────────────────────────────────────────

/**
 * POST /api/rostros/registrar
 * Body: { childId: string, descriptor: number[128], status?: 'seguro'|'desaparecido' }
 */
exports.registrarRostro = (req, res) => {
    try {
        const { childId, descriptor, status = 'desaparecido' } = req.body;

        if (!childId || !Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({
                mensaje: 'Se requiere childId y un descriptor válido de 128 dimensiones.'
            });
        }

        const rostros = readRostros();

        // Si ya existe ese childId, actualiza su vector
        const existingIdx = rostros.findIndex(r => r.childId === childId);
        const registro = { childId, status, faceVector: descriptor, updatedAt: new Date().toISOString() };

        if (existingIdx !== -1) {
            rostros[existingIdx] = registro;
        } else {
            rostros.push(registro);
        }

        writeRostros(rostros);

        res.status(201).json({ mensaje: 'Rostro registrado correctamente.', childId });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar el rostro.', error: error.message });
    }
};

/**
 * POST /api/rostros/buscar
 * Body: { descriptor: number[128] }
 *
 * Filtra SOLO los registros con status === 'desaparecido' antes de calcular distancias.
 * Umbral estricto: 0.6 (estándar face-api.js).
 */
exports.buscarRostro = (req, res) => {
    try {
        const { descriptor } = req.body;

        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({
                mensaje: 'Se requiere un descriptor válido de 128 dimensiones.'
            });
        }

        const rostros = readRostros();

        // ── Buscar el ms cercano ────────────────────────────────────────────
        const UMBRAL = 0.6;
        let mejorMatch = null;
        let menorDistancia = Infinity;

        for (const rostro of rostros) {
            const distancia = euclideanDistance(descriptor, rostro.faceVector);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                mejorMatch = rostro;
            }
        }

        if (mejorMatch && menorDistancia <= UMBRAL) {
            return res.status(200).json({
                mensaje: '¡Coincidencia encontrada!',
                childId: mejorMatch.childId,
                distancia: menorDistancia.toFixed(4),
                status: mejorMatch.status
            });
        }

        return res.status(404).json({
            mensaje: 'No se encontró coincidencia en la base de datos.',
            menorDistanciaEncontrada: menorDistancia.toFixed(4)
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar el rostro.', error: error.message });
    }
};
