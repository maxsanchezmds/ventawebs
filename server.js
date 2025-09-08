// server.js
const express = require('express');
const path = require('path');

const app = express();

// 1) Servir archivos estáticos de /public (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// 2) (Opcional, si luego quieres manejar formularios JSON/URL-encoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3) Ruta raíz: sirve index.html explícitamente (opcional si ya está en /public)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4) (Opcional) Ejemplo de endpoint para un formulario de contacto
// <form method="POST" action="/api/contact">...</form>
app.post('/api/contact', (req, res) => {
  const { nombre, email, mensaje } = req.body || {};
  console.log('Nuevo contacto:', { nombre, email, mensaje });
  // Aquí podrías enviar un correo, guardar en BD, etc.
  res.status(200).json({ ok: true, message: 'Formulario recibido.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
