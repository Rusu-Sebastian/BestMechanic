//importarea modulelor necesare
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { JsonDB, Config } from "node-json-db";
import { createInterface } from "readline";
import { exit } from "process";

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

//crearea bazei de date client.json
const db = new JsonDB(new Config("client", true, false, '/'));

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

//definirea functiei meniu
async function meniu() {
    const raspuns = await intrebare("Ce doriți să faceți?\n1. Adăugați clienți.\n2. Modificați client.\n3. Afisare clienti\n4. Ștergeți clienți.\n0. Ieșiți din aplicație.\nIntroduceți cifra corespunzătoare: ");
    switch (raspuns) {
        case "1":
            await adaugaClient();
            break;
        case "2":
            modificaClient();
            break;
        case "3":
            afisareClienti();
            break;
        case "4":
            stergeClient();
            break;
        case "0":
            exit();
        default:
            console.log("Opțiune invalidă");
            await meniu();
            break;
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

// definirea funcției de salvare a unui client în baza de date
async function salvareClient(client) {
    try {
        let clientiExistenti = await db.getData("/client");
        console.log("Clienti existenti:", clientiExistenti);
        if (!Array.isArray(clientiExistenti)) {
            clientiExistenti = [];
        }
        console.log("Clienti existenti:", clientiExistenti);
        clientiExistenti.push(client);
        db.push("/client", clientiExistenti, true);
    } catch (error) {
        console.error("Eroare la salvarea clientului:", error);
    }
    meniu();
}


//definirea functiei de modificare a unui client
async function modificaClient() {
    const raspuns = await intrebare("Introduceți numele si prenumele clientului pe care doriți să îl modificați: ");
    try {
        const clienti = await db.getData("/client");
        const client = clienti.find((client) => client.nume+" "+client.prenume === raspuns);
        if (Array.isArray(clienti)) {
            if (client) {
                console.log("Client găsit:", client);
                await modificaCampClient(client);
                console.log("Client modificat:", client);
                db.push("/client", clienti, true);
            }
            else {
                console.log("Clientul nu a fost găsit");
            }
        }
        else {
            console.log("Datele nu sunt în formatul corect");
        }
    } 
    catch (error) {
        console.error("Eroare la modificarea clientului:", error);
    }
    meniu();
}

//dedinirea funcției de modificare a unui camp al unui client
async function modificaCampClient(client) {
    const camp = await intrebare("Ce câmp doriți să modificați?\n1. Nume\n2. Prenume\n3. Număr de telefon\n4. Email\n5. Număr de mașini\n6. Modifica masinile clientului\nIntroduceți cifra corespunzătoare: ");
        switch (camp) {
            case "1":
                client.nume = await intrebare("Introduceți noul nume: ");
                break;
            case "2":
                client.prenume = await intrebare("Introduceți noul prenume: ");
                break;
            case "3":
                client.nrTelefon = await intrebare("Introduceți noul număr de telefon: ");
                break;
            case "4":
                client.email = await intrebare("Introduceți noul email: ");
                break;
            case "5":
                client.nrMasini = await intrebare("Introduceți noul număr de mașini: ");
                await adaugaMasini(client, client.nrMasini);
                break;
            case "6":
                await modificaMasini(client, client.nrMasini);
                break;
            default:
                console.log("Opțiune invalidă");
            break;
        }
    const raspuns = await intrebare("Doriți să modificați și alt camp? (da/nu): ");
        switch (raspuns) {
            case "da":
                await modificaCampClient(client);
                break;
            case "nu":
                break;
            default:
                console.log("Opțiune invalidă");
                break;
        }
    return client;
}
//definirea functiei de modificare a masinei clientului 
async function modificaMasini(client, nrMasini){
    const masina = await intrebare("Clientul are "+nrMasini+" mașini. Introduceți numărul mașinii pe care doriți să o modificați: ");
    try {
        if (client.masini[masina-1]) {
            console.log("Masina găsit:a", client.masina[masina-1]);
            const camp = await intrebare("Ce câmp doriți să modificați?\n1. Număr de înmatriculare\n2. Serie de șasiu\n3. Marca\n4. Model\n5. An de fabricație\n6. Tip motorizare\n7. Capacitate motor\n8. Cai putere\n9. Cutie de viteze\nIntroduceți cifra corespunzătoare: ");
            switch (camp) {
                case "1":
                    client.masini[i].nrDeInmatriculare = await intrebare("Introduceți noul număr de înmatriculare: ");
                    break;
                case "2":
                    client.masini[i].serieSasiu = await intrebare("Introduceți noua serie de șasiu: ");
                    break;
                case "3":
                    client.masini[i].marca = await intrebare("Introduceți noua marcă: ");
                    break;
                case "4":
                    client.masini[i].model = await intrebare("Introduceți noul model: ");
                    break;
                case "5":
                    client.masini[i].anFabricatie = await intrebare("Introduceți noul an de fabricație: ");
                    break;
                case "6":
                    client.masini[i].tipMotorizare = await intrebare("Introduceți noul tip de motorizare: ");
                    break;
                case "7":
                    client.masini[i].capacitateMotor = await intrebare("Introduceți noua capacitate a motorului: ");
                    break;
                case "8":
                    client.masini[i].caiPutere = await intrebare("Introduceți noii cai putere: ");
                    client.masini[i].kwPutere = client.masini[i].caiPutere * 0.735499;
                    break;
                case "9":
                    client.masini[i].cutieDeViteze = await intrebare("Introduceți noua cutie de viteze: ");
                    break;
                default:
                    console.log("Opțiune invalidă");
                    break;
            }
            console.log("Mașina modificată:", client.masini[i]);
            await intrebare("Doriți să modificați și alta mașina? (da/nu): ");
            switch (raspuns) {
                case "da":
                    await modificaMasini(client, nrMasini);
                    break;
                case "nu":
                    break;
                default:
                    console.log("Opțiune invalidă");
                    break;
            }
        }
        else {
            console.log("Clientul nu a fost găsit");
        }
    }
    catch (error) {
        console.error("Eroare la modificarea mașinii:", error);
    }
    meniu();
}

async function afisareClienti() {
    
    try {
        const clienti = await db.getData("/client");
        if (Array.isArray(clienti)) {
            console.log("Lista clienți:");
            clienti.forEach((client, index) => {
                console.log(`Client ${index + 1}:`);
                console.log(`Nume: ${client.nume}`);
                console.log(`Prenume: ${client.prenume}`);
                console.log(`Număr de telefon: ${client.nrTelefon}`);
                console.log(`Email: ${client.email}`);
                console.log(`Număr de mașini: ${client.nrMasini}`);
                console.log("Mașini:");
                client.masini.forEach((masina, masinaIndex) => {
                    console.log(`Mașina ${masinaIndex + 1}:`);
                    console.log(`Număr de înmatriculare: ${masina.nrDeInmatriculare}`);
                    console.log(`Serie de șasiu: ${masina.serieSasiu}`);
                    console.log(`Marca: ${masina.marca}`);
                    console.log(`Model: ${masina.model}`);
                    console.log(`An de fabricație: ${masina.anFabricatie}`);
                    console.log(`Tip motorizare: ${masina.tipMotorizare}`);
                    console.log(`Capacitate motor: ${masina.capacitateMotor}`);
                    console.log(`Cai putere: ${masina.caiPutere}`);
                    console.log(`Cutie de viteze: ${masina.cutieDeViteze}`);
                    console.log(`Kw putere: ${masina.kwPutere}`);
                });
                console.log("-----------------------------------");
            });
        }
        else {
            console.log("Datele nu sunt în formatul corect");
        }
    } catch (error) {
        console.error("Eroare la afișarea clienților:", error);
    }
    meniu();
}

//definirea funcției de ștergere a unui client
async function stergeClient() {
    const raspuns = await intrebare("Introduceți numele și prenumele clientului pe care doriți să îl ștergeți: ");
    try {
        const clienti = await db.getData("/client");
        if (Array.isArray(clienti)) {
            const client = clienti.find((client) => client.nume + " " + client.prenume === raspuns);
            if (client) {
                console.log("Client găsit:", client);
                const raspuns = await intrebare("Sunteți sigur că doriți să ștergeți clientul? (da/nu): ");
                switch (raspuns) {
                    case "da":
                        const index = clienti.indexOf(client);
                        clienti.splice(index, 1);
                        db.push("/client", clienti, true);
                        console.log("Client șters");
                        break;
                    case "nu":
                        console.log("Clientul nu a fost șters");
                        break;
                    default:
                        console.log("Opțiune invalidă");
                        break;
                }
            } else {
                console.log("Clientul nu a fost găsit");
            }
        } else {
            console.log("Datele din fișierul JSON nu sunt în formatul corect");
        }
    } catch (error) {
        console.error("Eroare la ștergerea clientului:", error);
    }
    meniu();
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