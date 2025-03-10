const express = require("express");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const cors = require("cors");
const app = express();
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const port = 4000;

// Utiliser CORS pour permettre les requêtes depuis d'autres origines
app.use(cors());

// Middleware pour analyser les données JSON envoyées dans les requêtes
app.use(express.json());

// Path du fichier CSV
const csvFilePath = path.join(__dirname, "verify.csv");

// Fonction pour créer le fichier CSV si nécessaire
const createCsvFileIfNeeded = () => {
  if (!fs.existsSync(csvFilePath)) {
    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: "email", title: "Email" },
        { id: "phone", title: "Phone" },
        { id: "message", title: "Message" },
        { id: "date", title: "Date" },
      ],
    });

    csvWriter.writeRecords([]); // Créer le fichier CSV vide au démarrage
  }
};

// Route pour enregistrer les données dans le fichier CSV
app.post("/verify", (req, res) => {
  const { email, phone, message } = req.body;

  // Vérification des champs requis
  if (!email || !phone || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis !" });
  }

  // Enregistrement des données dans le fichier CSV
  const newEntry = { email, phone, message, date: new Date().toISOString() };
  const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
      { id: "email", title: "Email" },
      { id: "phone", title: "Phone" },
      { id: "message", title: "Message" },
      { id: "date", title: "Date" },
    ],
    append: true,
  });

  // Enregistrer dans le CSV
  csvWriter
    .writeRecords([newEntry])
    .then(() => {
      res.status(200).json({ message: "Données enregistrées avec succès ✅" });
    })
    .catch((err) => {
      res.status(500).json({ error: "Erreur lors de l'enregistrement dans le fichier CSV." });
    });
});

// Route pour obtenir les données du fichier CSV
app.get("/data", (req, res) => {
  const results = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.status(200).json(results);
    })
    .on("error", (err) => {
      res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV." });
    });
});

// Créer le fichier CSV s'il n'existe pas lors du démarrage du serveur
createCsvFileIfNeeded();

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur Express démarré sur http://localhost:${port}`);
});
