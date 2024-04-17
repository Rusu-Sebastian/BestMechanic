// TODO mai adauga inca cv functionalitate ca ai facut tot ce era de facut



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
    constructor(nume, prenume, nrTelefon, email, masini) {
        this.id = uuidv4();
        this.nume = nume;
        this.prenume = prenume;
        this.nrTelefon = nrTelefon;
        this.email = email;
        this.nrMasini = masini.length;
        this.masini = masini;
    }
}

// Crearea obiectului programare
class programari {
    constructor(clientId, nrInmatriculare, data, ora, actiune, mecanic, status, pretEstimativ) {
        this.id = uuidv4();
        this.clientId = clientId;
        this.nrInmatriculare = nrInmatriculare;
        this.data = data;
        this.ora = ora;
        this.actiune = actiune;
        this.mecanic = mecanic;
        this.status = status;
        this.pretEstimativ = pretEstimativ;
    }
}

// Crearea unui obiect pentru a stoca preturile celor mai comune actiuni
const preturiActiuni = {
    "schimbare bujii": 50,
    "schimbare becuri": 20,
    "schimbare senzori": 100,
    "schimbare ulei": 100,
    "schimbare placute frana": 200,
    "schimbare anvelope": 200,
    "schimbare baterie": 150,
};

// Middleware pentru a putea folosi JSON în request-uri
app.use(express.json());

// Adăugare client nou
app.post("/clienti", async (req, res) => {
    verificaDateClienti();
    try {
        const { nume, prenume, nrTelefon, email, masini } = req.body;
        await verificareArray(masini);
        const clientNou = new client(nume, prenume, nrTelefon, email, masini);
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
        const {clientId, nrInmatriculare, data, ora, actiune, mecanic, status} = req.body;
        const pretEstimativ = preturiActiuni[actiune];
        if(pretEstimativ === undefined) {
            console.log("Actiunea nu exista in lista de preturi");
            res.status(400).json({ error: "Actiunea nu exista in lista de preturi" });
        }
        const programareNoua = new programari(clientId, nrInmatriculare, data, ora, actiune, mecanic, status, pretEstimativ)
        if(!intervalValid(programareNoua.ora)) {
            res.status(400).json({ error: "Intervalul orar nu este valid" });
        };
        console.log(programareNoua);
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

// Adăugare mașină pentru client
app.post("/clienti/:id/masini", async (req, res) => {
    const id = req.params.id;
    const masinaNoua = req.body;
    try {
        const client = await gasesteClient(id);
        client.masini.push(masinaNoua);
        await editareClient(id, { masini: client.masini });
        res.status(201).json({ message: "Mașină adăugată", masina: masinaNoua });
    } catch (error) {
        console.error("Eroare la adăugarea mașinii pentru client:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Afișare mașini pentru client
app.get("/clienti/:id/masini", async (req, res) => {
    const id = req.params.id;
    try {
        const client = await gasesteClient(id);
        res.status(200).json(client.masini);
    } catch (error) {
        console.error("Eroare la afișarea mașinilor clientului:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Ștergere mașină pentru client
app.delete("/clienti/:id/masini/:nrInmatriculare", async (req, res) => {
    const id = req.params.id;
    const nrInmatriculare = req.params.nrInmatriculare;
    try {
        const client = await gasesteClient(id);
        client.masini = client.masini.filter(masina => masina.nrInmatriculare !== nrInmatriculare);
        await editareClient(id, { masini: client.masini });
        res.status(200).json({ message: "Mașină ștearsă" });
    } catch (error) {
        console.error("Eroare la ștergerea mașinii pentru client:", error);
        res.status(500).json({ error: "Eroare internă" });
    }
});

// Modificare mașină pentru client
app.put("/clienti/:id/masini/:nrInmatriculare", async (req, res) => {
    const id = req.params.id;
    const nrInmatriculare = req.params.nrInmatriculare;
    const dateActualizate = req.body;
    try {
        const client = await gasesteClient(id);
        const masinaIndex = client.masini.findIndex(masina => masina.nrInmatriculare === nrInmatriculare);
        if (masinaIndex !== -1) {
            client.masini[masinaIndex] = { ...client.masini[masinaIndex], ...dateActualizate };
            await editareClient(id, { masini: client.masini });
            res.status(200).json({ message: "Datele mașinii au fost actualizate" });
        } else {
            res.status(404).json({ error: "Mașina nu a fost găsită" });
        }
    } catch (error) {
        console.error("Eroare la editarea datelor mașinii pentru client:", error);
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
        return;
    } catch (error) {
        console.error("Eroare la salvarea clientului:", error);
        throw error;
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


// Verificarea datellor clientilor existenti în fișierul baza.json
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

// Definirea funcției de găsire a unui client după ID
async function gasesteClient(clientId) {
    try {
        const clienti = await db.getData("/clienti");
        const clientGasit = clienti.find(client => client.id === clientId);
        if (!clientGasit) {
            throw new Error("Clientul nu a fost găsit");
        }
        return clientGasit;
    } catch (error) {
        console.error("Eroare la găsirea clientului:", error);
        throw error;
    }
}


// Definirea funcției de validare a orei programării
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

// Definirea functiei de verificare a programarilor existente în fișierul baza.json
async function verificaDateProgramari() {
    try {
        let programariExistente = db.getData("/programari");
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
    console.log(`Serverul a pornit pe portul: ${port}`);
});