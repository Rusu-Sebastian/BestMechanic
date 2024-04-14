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
    anFabricatie;
    tipMotorizare;
    capacitateMotor;
    caiPutere;
    kwPutere=caiPutere/1.36;
    cutieDeViteza;
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
    const masina1 = new masina();
    masina1.nrDeInmatriculare = req.body.nrDeInmatriculare;
    masina1.serieSasiu = req.body.serieSasiu;
    masina1.marca = req.body.marca;
    masina1.model = req.body.model;
    masina1.anFabricatie = req.body.anFabricatie;
    masina1.tipMotorizare = req.body.tipMotorizare;
    masina1.capacitateMotor = req.body.capacitateMotor;
    masina1.caiPutere = req.body.caiPutere;
    masina1.cutieDeViteza = req.body.cutieDeViteza;
    console.log(masina1);
    res.send('Formular completat cu succes!');
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