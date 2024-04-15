//importarea modulelor necesare
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { JsonDB, Config } from "node-json-db";
import { createInterface } from "readline";

//crearea obiectului app pentru a putea folosi serverul express
const app = express();
const port = 3000;

//definirea variabilelor __filename și __dirname pentru a putea folosi path-ul curent
//probabil nu mai e nevoie de aceste variabile, dar le las așa pentru compatibilitate
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//crearea interfeței pentru citirea de la tastatură
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

//definirea claselor client și mașină
class client {
    constructor(nume, prenume, nrTelefon, email, nrMasini) {
        this.nume = nume;
        this.prenume = prenume;
        this.nrTelefon = nrTelefon;
        this.email = email;
        this.nrMasini = nrMasini;
        this.masini = [];
    }
}

class masina {
    constructor(nrDeInmatriculare, serieSasiu, marca, model, anFabricatie, tipMotorizare, capacitateMotor, caiPutere, cutieDeViteze, kwPutere) {
        this.nrDeInmatriculare = nrDeInmatriculare;
        this.serieSasiu = serieSasiu;
        this.marca = marca;
        this.model = model;
        this.anFabricatie = anFabricatie;
        this.tipMotorizare = tipMotorizare;
        this.capacitateMotor = capacitateMotor;
        this.caiPutere = caiPutere;
        this.cutieDeViteze = cutieDeViteze;
        this.kwPutere = kwPutere;
    }
}

//definirea funcției de întrebare pentru a putea folosi async/await
function intrebare(question) {
    return new Promise((resolve, reject) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

//definirea funcției de adăugare a mașinilor pentru un client
async function adaugaMasini(clientNou, nrMasini) {
    for (let i = 0; i < nrMasini; i++) {
        const masinaNoua = new masina();
        masinaNoua.nrDeInmatriculare = await intrebare(`Introduceți numărul de înmatriculare al mașinii ${i + 1}: `);
        masinaNoua.serieSasiu = await intrebare(`Introduceți seria de șasiu a mașinii ${i + 1}: `);
        masinaNoua.marca = await intrebare(`Introduceți marca mașinii ${i + 1}: `);
        masinaNoua.model = await intrebare(`Introduceți modelul mașinii ${i + 1}: `);
        masinaNoua.anFabricatie = await intrebare(`Introduceți anul de fabricație al mașinii ${i + 1}: `);
        masinaNoua.tipMotorizare = await intrebare(`Introduceți tipul motorizării mașinii ${i + 1}: `);
        masinaNoua.capacitateMotor = await intrebare(`Introduceți capacitatea motorului mașinii ${i + 1}: `);
        masinaNoua.caiPutere = await intrebare(`Introduceți caii putere ai motorului mașinii ${i + 1}: `);
        masinaNoua.kwPutere = masinaNoua.caiPutere * 0.735499;
        masinaNoua.cutieDeViteze = await intrebare(`Introduceți cutia de viteze a mașinii ${i + 1}: `);
        clientNou.masini.push(masinaNoua);
    }
}

//definirea funcției de adăugare a unui client
async function adaugaClient() {
    const clientNou = new client();
    clientNou.nume = await intrebare("Introduceți numele clientului: ");
    clientNou.prenume = await intrebare("Introduceți prenumele clientului: ");
    clientNou.nrTelefon = await intrebare("Introduceți numărul de telefon al clientului: ");
    clientNou.email = await intrebare("Introduceți email-ul clientului: ");
    const nrMasini = parseInt(await intrebare("Introduceți numărul de mașini pe care clientul le va lăsa pentru reparații: "));
    clientNou.nrMasini = nrMasini;
    await adaugaMasini(clientNou, nrMasini);
    console.log("Client adăugat:", clientNou);
    salvareClient(clientNou);
}

//definirea functiei meniu
async function meniu() {
    const raspuns = await intrebare("Ce doriți să faceți? (introduceți cifra corespunzătoare)\n1. Adăugați clienți.\n2. Modificați client.\n3. Ștergeți clienți.\n");
    switch (raspuns) {
        case "1":
            await adaugaClient();
            break;
        case "2":
            modificaClient();
            break;
        case "3":
            stergeClient();
            break;
        default:
            console.log("Opțiune invalidă");
            await meniu();
            break;
    }
}

//definirea functiei de modificare a unui client
function modificaClient() {
    //TODO: Implementare funcție
    console.log("Mai așteaptă");
    meniu();
}

//definirea funcției de ștergere a unui client
function stergeClient() {
    //TODO: Implementare funcție
    console.log("Mai așteaptă");
    meniu();
}

//definirea funcției de salvare a unui client în baza de date
function salvareClient(client) {
    try {
        const db = new JsonDB(new Config("clienti", true, false, '/'));
        db.push("/clienti[]", client, true);
    } catch (error) {
        console.error("Eroare la salvarea clientului:", error);
    }
}

//definirea rutei principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

//pornirea serverului pe portul 3000 și afișarea unui mesaj de confirmare
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    meniu();
});

//eroare 404 pentru rutele inexistente
app.use((req, res) => {
    res.status(404).send("Not Found");
});