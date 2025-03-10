const express = require("express");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const cors = require("cors"); // Importer CORS
const app = express();
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser"); 

const port = 4000;

// Utiliser CORS pour permettre les requêtes depuis d'autres origines (par exemple, frontend localhost:3000)
app.use(cors());

// Middleware pour analyser les données JSON envoyées dans les requêtes
app.use(express.json());

// Route pour vérifier l'email et enregistrer les données dans un fichier CSV
app.post("/verify", (req, res) => {
  const { email, phone, message } = req.body;

  // Vérification de l'email et du numéro de téléphone
  if (!email || !phone || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis !" });
  }

  const emailList = require("./emails.json");
  const isEmailValid = emailList.includes(email.toLowerCase());
  const isPhoneValid = /^\d{9}$/.test(phone); // Validation du numéro de téléphone : exactement 9 chiffres

  // Enregistrement des données dans le fichier CSV (en dehors des validations)
  const newEntry = { email, phone, message, date: new Date().toISOString() };

  const csvFilePath = path.join(__dirname, "verify.csv");

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

  if (!fs.existsSync(csvFilePath)) {
    csvWriter.writeRecords([]); // Créer le fichier CSV si nécessaire
  }

  csvWriter
    .writeRecords([newEntry]) // Enregistrer même si l'email n'est pas valide
    .then(() => {
      // Validation de l'email et du téléphone après l'enregistrement
      if (!isEmailValid) {
        return res.status(400).json({ message: "Vous n'êtes pas de cette session ❌" });
      }

      if (!isPhoneValid) {
        return res.status(400).json({ message: "Le numéro de téléphone doit contenir exactement 9 chiffres ❌" });
      }

      res.status(200).json({ message: "Vous êtes de cette session ✅" });
    })
    .catch((err) => {
      res.status(500).json({ error: "Erreur lors de l'enregistrement dans le fichier CSV." });
    });
});
// Route pour obtenir les données du fichier CSV
app.get("/data", (req, res) => {
    const csvFilePath = path.join(__dirname, "verify.csv");
  
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
  
// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur Express démarré sur http://localhost:${port}`);
});
