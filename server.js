const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base de datos en memoria para los votos
let votes = {
  PN: 0,
  LIBRE: 0,
  PLH: 0,
  Otro: 0,
  Ninguno: 0
};

// Base de datos en memoria para los usuarios
// Usaremos el email como clave para identificar a cada usuario
let users = {};
let nextUserId = 1;

// Base de datos en memoria para el historial de votos de los usuarios
let userVotes = {};
let deleteCounts = {};

// Rutas de Login y Registro
// ---------------------------------

// Ruta de registro
app.post('/api/register', (req, res) => {
  const { nombre, apellido, email, nacimiento } = req.body;
  const user = users[email];

  if (user) {
    // Si el email ya existe, verificamos si los datos coinciden
    if (user.nombre === nombre && user.apellido === apellido && user.nacimiento === nacimiento) {
      // Si los datos coinciden, no es un nuevo registro, simplemente un login
      return res.status(200).json({ message: "Usuario existente." });
    } else {
      // Si los datos no coinciden, es un intento de registrar un email existente con datos diferentes
      return res.status(400).json({ message: "Email ya registrado con otros datos." });
    }
  }

  // Crear un nuevo usuario
  const newUserId = `user${nextUserId++}`;
  users[email] = {
    userId: newUserId,
    nombre,
    apellido,
    email,
    nacimiento
  };

  res.status(201).json({ message: "Registro exitoso.", userId: newUserId });
});

// Ruta de login
app.post('/api/login', (req, res) => {
  const { email, nombre, apellido, nacimiento } = req.body;
  const user = users[email];

  if (!user || user.nombre !== nombre || user.apellido !== apellido || user.nacimiento !== nacimiento) {
    return res.status(401).json({ message: "Datos de login incorrectos." });
  }

  res.status(200).json({ message: "Login exitoso.", userId: user.userId });
});

// Rutas de Votación
// ---------------------------------

// Ruta para obtener el total de votos
app.get('/api/votes', (req, res) => {
  res.json(votes);
});

// Ruta para registrar un voto
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

// Ruta para eliminar un voto
app.delete('/api/vote', (req, res) => {
  const { userId } = req.body;

  if (!userVotes[userId]) {
    return res.status(400).json({ message: "No tienes un voto para eliminar." });
  }
  
  if (deleteCounts[userId] === undefined) {
    deleteCounts[userId] = 0;
  }

  if (deleteCounts[userId] >= 3) {
    return res.status(403).json({ message: "Has alcanzado el límite de 3 eliminaciones." });
  }

  const party = userVotes[userId];
  votes[party]--;
  delete userVotes[userId];
  deleteCounts[userId]++;

  res.status(200).json({ message: 'Voto eliminado exitosamente.', votes });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor de votación corriendo en http://localhost:${port}`);

});
