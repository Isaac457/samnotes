const express = require("express");
const { Client } = require("pg");

const app = express();
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect();

// page formulaire
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/form.html");
});

// ajouter étudiant + note
app.post("/add", async (req, res) => {
  const { name, subject, score } = req.body;

  const student = await client.query(
    "INSERT INTO students(name) VALUES($1) RETURNING id",
    [name]
  );

  await client.query(
    "INSERT INTO grades(student_id, subject, score) VALUES($1,$2,$3)",
    [student.rows[0].id, subject, score]
  );

  res.redirect("/students");
});

// afficher liste
app.get("/students", async (req, res) => {
  const result = await client.query(`
    SELECT students.name, grades.subject, grades.score
    FROM students
    JOIN grades ON students.id = grades.student_id
  `);

  let html = "<h1>Liste des étudiants</h1><ul>";
  result.rows.forEach(r => {
    html += `<li>${r.name} - ${r.subject}: ${r.score}</li>`;
  });
  html += "</ul><a href='/'>Ajouter</a>";

  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
