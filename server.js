// server.js
const express = require('express');
const path = require('path');

// Forzar redirección a HTTPS en toda la aplicación
app.enable('trust proxy');
app.use((req, res, next) => {
  if (req.secure) return next();
  res.redirect(`https://${req.headers.host}${req.url}`);
});

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

// Exponer de forma explícita el sitemap para los bots de búsqueda
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});


// 4) Endpoint para recibir solicitudes de contacto y crear un evento
// en Google Calendar mediante un Apps Script publicado como web app.
app.post('/api/contact', async (req, res) => {
  const { fecha, hora, telefono } = req.body || {};
  console.log('Nuevo contacto:', { fecha, hora, telefono });

  try {
    // Validación básica de fecha y hora para evitar agendas en el pasado
    if (!fecha || !hora) {
      return res.status(400).json({ ok: false, message: 'Fecha y hora requeridas' });
    }

    const [Y, M, D] = fecha.split('-').map(Number);
    const [h, m]    = hora.split(':').map(Number);
    const selectedDate = new Date(Y, M - 1, D, h, m, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ ok: false, message: 'Fecha u hora inválida' });
    }

    if (selectedDate < new Date()) {
      return res.status(400).json({ ok: false, message: 'La fecha/hora debe ser en el futuro' });
    }
    const gsResponse = await fetch(
      'https://script.google.com/macros/s/AKfycbxgvPNHUDNzZx0kp8jgq1LdlxJaxIXvA_M-RZu1rsS9Cagor8nsCGPAAg3PHnJQBqo4Lw/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, hora, telefono }),
      }
    );

    if (!gsResponse.ok) {
      throw new Error(`Google Script responded with ${gsResponse.status}`);
    }

    const data = await gsResponse.json();
    res.status(200).json({ ok: true, message: 'Agenda creada', data });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ ok: false, message: 'No se pudo crear la agenda' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
