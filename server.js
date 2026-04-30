const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('recookie.db');

// Crear tablas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      fecha TEXT,
      total REAL,
      unidades INTEGER,
      ganancia REAL
    )
  `);
});

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (row) {
        return res.json(row);
      }

      // Si no existe, lo crea
      db.run(
        "INSERT INTO users (username, password) VALUES (?,?)",
        [username, password],
        function () {
          res.json({ id: this.lastID, username });
        }
      );
    }
  );
});

// GUARDAR REGISTRO
app.post('/guardar', (req, res) => {
  const { user_id, total, unidades, ganancia } = req.body;
  const fecha = new Date().toISOString();

  db.run(
    "INSERT INTO registros (user_id, fecha, total, unidades, ganancia) VALUES (?,?,?,?,?)",
    [user_id, fecha, total, unidades, ganancia],
    () => res.json({ ok: true })
  );
});

// OBTENER HISTORIAL
app.get('/historial/:user_id', (req, res) => {
  db.all(
    "SELECT * FROM registros WHERE user_id=? ORDER BY fecha DESC",
    [req.params.user_id],
    (err, rows) => res.json(rows)
  );
});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo");
});