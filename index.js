import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import {JSONDB} from "@beforesemicolon/node-json-db";

//constante pentru crearea serverului
const app = express();
const port = 3000;

//constante pentru a putea folosi path-ul
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//obiect informatii despre client
class client{
    nume;
    prenume;
    nrTelefon;
    email;
    nrMasini;
}

//obiect cu informatiile despre masina clientului
class masina{
    nrDeInmatriculare;
    serieSasiu;
    marca;
    model;
    anFabricare;
    tipMotorizare;
    capacitateMotor;
    caiPutere;
    cutieDeViteza;
    kwPutere = Number(this.caiPutere) * 0.73549875;
}

//trimite fisierul index.html la client
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//middleware pentru a putea folosi body-parser
app.use(express.urlencoded({ extended: true }));

//primirea formularului de la client si stocarea informatiilor in obiectul client
app.post('/submit', (req, res) => {
    const clientNou = new client();
    clientNou.nume = req.body.nume;
    clientNou.prenume = req.body.prenume;
    clientNou.nrTelefon = req.body.nrTelefon;
    clientNou.email = req.body.email;
    clientNou.nrMasini = req.body.nrMasini;
    console.log(clientNou);
    for (var i = 0; i < clientNou.nrMasini; i++) {
        res.send( `
        <h2>Date mașină ${i + 1}</h2>
        <form action="/submitCar" method="post">
        <label for="nrDeInmatriculare">Numar de inmatriculare:</label>
        <input type="text" id="nrDeInmatriculare" name="nrDeInmatriculare" required><br>

        <label for="serieSasiu">Serie Sasiu:</label>
        <input type="text" id="serieSasiu" name="serieSasiu" required><br>

        <label for="marca">Marca:</label>
        <input type="text" id="marca" name="marca" required><br>

        <label for="model">Model:</label>
        <input type="text" id="model" name="model" required><br>

        <label for="anFabricatie">An de fabricare:</label>
        <input type="number" id="anFabricare" name="anFabricare" required><br>

        <label for="tipMotorizare">Tip Motorizare:</label>
        <select id="tipMotorizare" name="tipMotorizare" required>
            <option value="benzina">Benzina</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hibrid">Hibrid</option>
            <option value="altul">Altul</option>
        </select><br>

        <label for="capacitateMotor">Capacitate motor:</label>
        <input type="number" id="capacitateMotor" name="capacitateMotor" required><br>

        <label for="caiPutere">CaiPutere:</label>
        <input type="number" id="caiPutere" name="caiPutere" required><br>

        <label for="cutieDeViteza">Cutie de viteza:</label>
        <select id="cutieDeViteza" name="cutieDeViteza" required>
            <option value="manuala">Manuala</option>
            <option value="automata">Automata</option>
        </select><br>

        <input type="submit" value="Adaugă mașină">
        </form>
    `);
    }
});

app.post('/submitCar', (req, res) => {
    const masina1 = new masina();
    masina1.nrDeInmatriculare = req.body.nrDeInmatriculare;
    masina1.serieSasiu = req.body.serieSasiu;
    masina1.marca = req.body.marca;
    masina1.model = req.body.model;
    masina1.anFabricare = req.body.anFabricare;
    masina1.tipMotorizare = req.body.tipMotorizare;
    masina1.capacitateMotor = req.body.capacitateMotor;
    masina1.caiPutere = req.body.caiPutere;
    masina1.cutieDeViteza = req.body.cutieDeViteza;
    console.log(masina1);
    res.send('Masina adaugata');
});

//folosirea fisierului clienti.json ca baza de date
const db = new JSONDB("clienti");

db.insert({clientNou}, {masina1});

//pornirea serverului
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
  

//middleware pentru a trata cazurile in care ruta nu exista
app.use((req, res) => {
    res.status(404).send('Not Found');
});