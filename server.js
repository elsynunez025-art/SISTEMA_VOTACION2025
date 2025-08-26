const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------------------------
// Base de datos en memoria
// -------------------------
let votes = { PN: 0, LIBRE: 0, PLH: 0, Otro: 0, Ninguno: 0 };
let users = {};
let nextUserId = 1;
let userVotes = {};
let deleteCounts = {};

// -------------------------
// Servir archivos estáticos (CSS, JS, imágenes)
// -------------------------
app.use(express.static(path.join(__dirname)));

// -------------------------
// Ruta raíz → login
// -------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html')); // tu login.html
});

// -------------------------
// Registro de usuarios
// -------------------------
app.post('/api/register', (req, res) => {
  const { nombre, apellido, email, nacimiento } = req.body;
  const user = users[email];

  if (user) {
    if (user.nombre === nombre && user.apellido === apellido && user.nacimiento === nacimiento) {
      return res.status(200).json({ message: "Usuario existente." });
    } else {
      return res.status(400).json({ message: "Email ya registrado con otros datos." });
    }
  }

  const newUserId = `user${nextUserId++}`;
  users[email] = { userId: newUserId, nombre, apellido, email, nacimiento };
  res.status(201).json({ message: "Registro exitoso.", userId: newUserId });
});

// -------------------------
// Login
// -------------------------
app.post('/api/login', (req, res) => {
  const { email, nombre, apellido, nacimiento } = req.body;
  const user = users[email];

  if (!user || user.nombre !== nombre || user.apellido !== apellido || user.nacimiento !== nacimiento) {
    return res.status(401).json({ message: "Login incorrecto." });
  }

  // Login correcto → frontend redirige a index.html
  res.status(200).json({ message: "Login exitoso.", userId: user.userId });
});

// -------------------------
// Rutas de votación
// -------------------------
app.get('/api/votes', (req, res) => res.json(votes));

app.post('/api/vote', (req, res) => {
  const { userId, party } = req.body;

  if (userVotes[userId] && userVotes[userId] !== party) {
    return res.status(400).json({ message: "Ya has votado por otro partido." });
  }
  if (userVotes[userId] === party) {
    return res.status(200).json({ message: "Voto ya registrado." });
  }

  userVotes[userId] = party;
  votes[party]++;
  res.status(200).json({ message: 'Voto registrado exitosamente.', votes });
});

app.delete('/api/vote', (req, res) => {
  const { userId } = req.body;

  if (!userVotes[userId]) return res.status(400).json({ message: "No tienes un voto para eliminar." });

  deleteCounts[userId] = deleteCounts[userId] || 0;
  if (deleteCounts[userId] >= 3) return res.status(403).json({ message: "Has alcanzado el límite de 3 eliminaciones." });

  const party = userVotes[userId];
  votes[party]--;
  delete userVotes[userId];
  deleteCounts[userId]++;

  res.status(200).json({ message: 'Voto eliminado exitosamente.', votes });
});

// -------------------------
// Servir index.html después de login (opcional, depende del frontend)
// -------------------------
// Tu frontend debe redirigir a index.html después de login exitoso

// -------------------------
// Inicia el servidor
// -------------------------
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
