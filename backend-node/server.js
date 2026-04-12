const express = require('express');
const cors = require('cors');
const path = require('path');
const gafetesRoutes = require('./routes/gafetes');
const rostrosRoutes = require('./routes/rostros');

const app = express();
const PORT = process.env.PORT || 5001; // Cambiado a 5001 para evitar conflictos en macOS

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/gafetes', gafetesRoutes);
app.use('/api/rostros', rostrosRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
