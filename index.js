// TODO crearea functii separate pentru adaugare, afisare, stergere si editare care sa ia parametrii on functie de ce se doreste
// TODO curatare cod, inca sunt chestii nefolosite ramase din teste
// TODO verifica clasele daca sunt necesare masini si programare ca nu sunt folosite 

// Importarea modulelor necesare
import express from "express";
import { JsonDB, Config } from "node-json-db";
import { v4 as uuidv4 } from "uuid";

// Crearea unui server express
const app = express();
const port = 3000;

// Crearea bazei de date JSON
const db = new JsonDB(new Config("baza", true, false, '/'));

// Crearea obiectului client
class client {
    constructor(nume, prenume, nrTelefon, email, nrMasini) {
        this.id = uuidv4();
        this.nume = nume;
        this.prenume = prenume;
        this.nrTelefon = nrTelefon;
        this.email = email;
        this.nrMasini = nrMasini;
        this.masini = [];
    }
}

// Crearea obiectului masina
class masinaa {
    constructor(nrInmatriculare, serieSasiu, marca, model, anFabricatie, tipMotorizare, capacitateMotor, caiPutere, cutieDeViteze, kwPutere) {
        this.masinaId = uuidv4();
        this.nrInmatriculare = nrInmatriculare;
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

// Crearea obiectului programare
class programari {
    constructor(clientId, nrInmatriculare, data, ora, actiune, mecanic, stare) {
        this.id = uuidv4();
        this.clientId = clientId;
        this.nrInmatriculare = nrInmatriculare;
        this.data = data;
        this.ora = ora;
        this.actiune = actiune;
        this.mecanic = mecanic;
        this.stare = stare;
    }
}

// Middleware pentru a putea folosi JSON în request-uri
app.use(express.json());

// Adăugare client nou
app.post("/clienti", async (req, res) => {
    verificaDateClienti();
    try {
        const { nume, prenume, nrTelefon, email, nrMasini, masini } = req.body;
        const clientNou = new client(nume, prenume, nrTelefon, email, nrMasini, masini);
        clientNou.masini = req.body.masini;
        await salvareClient(clientNou);
        res.status(201).json({ message: "Client adăugat", client: clientNou });
    } catch (error) {
        console.error("Eroare la adăugarea clientului:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Afișare clienți
app.get("/clienti", async (req, res) => {
    verificaDateClienti();
    try {
        const clienti = await afisareClienti();
        res.status(200).json(clienti);
    } catch (error) {
        console.error("Eroare la afișarea clienților:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Ștergere client
app.delete("/clienti/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await stergeClient(id);
        res.status(200).json({ message: "Client șters" });
    } catch (error) {
        console.error("Eroare la ștergerea clientului:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Editare client
app.put("/clienti/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await editareClient(id, req.body);
        res.status(200).json({ message: "Datele clientului au fost actualizate" });
    } catch (error) {
        console.error("Eroare la editarea datelor clientului:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Adăugare programare
app.post("/programari", async (req, res) => {
    verificaDateProgramari();
    try{
        const programare = req.body;
        if(!intervalValid(programare.ora)) {
            res.status(400).json({ error: "Intervalul orar nu este valid" });
        }
        const programareNoua = new programari(programare.clientId, programare.nrInmatriculare, programare.data, programare.ora, programare.actiune, programare.mecanic, programare.stare);
        await salvareProgramare(programareNoua);
        res.status(201).json({ message: "Programare adăugată", programare: programareNoua });
    } catch (error) {
        console.error("Eroare la adăugarea programării:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Afisare programari
app.get("/programari", async (req, res) => {
    verificaDateProgramari();
    try {
        const programari = await afisareProgramari();
        res.status(200).json(programari);
    } catch (error) {
        console.error("Eroare la afișarea programărilor:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Ștergere programare
app.delete("/programari/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await stergeProgramare(id);
        res.status(200).json({ message: "Programare ștearsă" });
    } catch (error) {
        console.error("Eroare la ștergerea programării:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Modificare programare
app.put("/programari/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await editareProgramare(id, req.body);
        res.status(200).json({ message: "Datele programării au fost actualizate" });
    } catch (error) {
        console.error("Eroare la editarea datelor programării:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Definirea functiei de verificarea array
async function verificareArray(ar) {
    if (!Array.isArray(ar)) {
        ar = [];
    }
    return ar;
}

// Definirea funcției de salvare a unui client în baza de date
async function salvareClient(client) {
    try {
        let clientiExistenti = await db.getData("/clienti");
        await verificareArray(clientiExistenti);
        clientiExistenti.push(client);
        db.push("/clienti", clientiExistenti, true);
    } catch (error) {
        console.error("Eroare la salvarea clientului:", error);
    }
}

// Definirea funcției de afișare a clienților
async function afisareClienti() {
    try {
        const clienti = await db.getData("/clienti");
        return clienti;
    } catch (error) {
        console.error("Eroare la afișarea clienților:", error);
        throw error;
    }
}

// Definirea funcției de ștergere a unui client
async function stergeClient(id) {
    try {
        let clienti = await db.getData("/clienti");
        await verificareArray(clienti);
        clienti = clienti.filter((client) => client.id !== id);
        db.push("/clienti", clienti, true);
    } catch (error) {
        console.error("Eroare la ștergerea clientului:", error);
        throw error;
    }
}


// Verificăm datele clientilor existente în fișierul baza.json
async function verificaDateClienti() {
    let clientiExistenti;
    try {
        clientiExistenti = db.getData("/clienti");
        await verificareArray(clientiExistenti);
    } catch (error) {
        console.error("Nu există date în fișierul baza.json");
        }
        return;
    }

// Definirea funcției de editare a datelor unui client
async function editareClient(id, dateUpdatate) {
    try {
        let clienti = await db.getData("/clienti");
        await verificareArray(clienti);
        const index = clienti.findIndex(client => client.id === id);
        if (index !== -1) {
            clienti[index] = { ...clienti[index], ...dateUpdatate };
            db.push("/clienti", clienti, true);
        } else {
            throw new Error("Clientul nu a fost găsit");
        }
    } catch (error) {
        console.error("Eroare la editarea datelor clientului:", error);
        throw error;
    }
}


// Definirea funcției de salvare a unei programări în baza de date
async function intervalValid(ora) {
    return ora >= 8 && ora <= 17 && ora % 0.5 === 0;
}

// Definirea funcției de salvare a unei programări în baza de date
async function salvareProgramare(programare) {
    try {
        let programariExistente = await db.getData("/programari");
        await verificareArray(programariExistente);
        programariExistente.push(programare);
        db.push("/programari", programariExistente, true);
    } catch (error) {
        console.error("Eroare la salvarea programării:", error);
        throw error;
    }

}

// Verificăm datele programarilor existente în fișierul baza.json
async function verificaDateProgramari() {
    let programariExistente;
    try {
        programariExistente = db.getData("/programari");
        await verificareArray(programariExistente);
    } catch (error) {
        console.error("Nu există date în fișierul baza.json");
        }
    return;
}

// Definirea funcției de afișare a programărilor
async function afisareProgramari() {
    try {
        const programari = await db.getData("/programari");
        return programari;
    } catch (error) {
        console.error("Eroare la afișarea programărilor:", error);
        throw error;
    }
}

// Definirea funcției de ștergere a unei programări
async function stergeProgramare(id) {
    try {
        let programari = await db.getData("/programari");
        await verificareArray(programari);
        programari = programari.filter((programare) => programare.id !== id);
        db.push("/programari", programari, true);
    } catch (error) {
        console.error("Eroare la ștergerea programării:", error);
        throw error;
    }
}

// Definirea funcției de editare a datelor unei programări
async function editareProgramare(id, dateUpdatate) {
    try {
        let programari = await db.getData("/programari");
        await verificareArray(programari);
        const index = programari.findIndex(programare => programare.id === id);
        if (index !== -1) {
            programari[index] = { ...programari[index], ...dateUpdatate };
            db.push("/programari", programari, true);
        } else {
            throw new Error("Programarea nu a fost găsită");
        }
    } catch (error) {
        console.error("Eroare la editarea datelor programării:", error);
        throw error;
    }
}

// Pornirea serverului
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});