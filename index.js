// Importarea modulelor necesare
import express from "express";
import { JsonDB, Config } from "node-json-db";
import { v4 as uuidv4 } from "uuid";

// Crearea unui server express
const app = express();
const port = 3000;

// Crearea bazei de date
const db = new JsonDB(new Config("baza", true, true, "/"));

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

class feedback {
    constructor(programareId, clientId, nota, comentariu) {
        this.programareId = programareId;
        this.clientId = clientId;
        this.nota = nota;
        this.comentariu = comentariu;
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
        eroare(error, res);
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
        eroare(error, res);
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
        eroare(error, res);
    }
});

// Adăugare feedback
app.post("/feedback", async (req, res) => {
    verificaDateFeedback();
    try {
        const { programareId, clientId, nota, comentariu } = req.body;
        const feedbackNou = new feedback(programareId, clientId, nota, comentariu);
        await salvareFeedback(feedbackNou);
        res.status(201).json({ message: "Feedback adăugat", feedback: feedbackNou });
    } catch (error) {
        eroare(error, res);
    }
});

// Afișare clienți
app.get("/clienti", async (req, res) => {
    verificaDateClienti();
    try {
        const clienti = await afisareClienti();
        res.status(200).json(clienti);
    } catch (error) {
        eroare(error, res);
    }
});


// Afișare mașini pentru client
app.get("/clienti/:id/masini", async (req, res) => {
    const id = req.params.id;
    try {
        const client = await gasesteClient(id);
        res.status(200).json(client.masini);
    } catch (error) {
        eroare(error, res);
    }
});

// Afisare programari
app.get("/programari", async (req, res) => {
    verificaDateProgramari();
    try {
        const programari = await afisareProgramari();
        res.status(200).json(programari);
    } catch (error) {
        eroare(error, res);
    }
});


// Afișare feedback
app.get("/feedback", async (req, res) => {
    verificaDateFeedback();
    try {
        const feedback = await afisareFeedback();
        res.status(200).json(feedback);
    } catch (error) {
        eroare(error, res);
    }
});

// Editarea partiala a clientului
app.patch("/clienti/:id", async (req, res) => {
    const id = req.params.id;
    const dateUpdatate = req.body;
    try {
        const client = await gasesteClient(id);
        for (const key in dateUpdatate) {
            if (dateUpdatate.hasOwnProperty(key)) {
                client[key] = dateUpdatate[key];
            }
        }
        await editareClient(id, client);
        res.status(200).json({ message: "Datele clientului au fost actualizate", client });
    } catch (error) {
        eroare(error, res);
    }
});

// Editarea partiala a masinii pentru client
app.patch("/clienti/:id/masini/:nrInmatriculare", async (req, res) => {
    const id = req.params.id;
    const nrInmatriculare = req.params.nrInmatriculare;
    const dateUpdatate = req.body;
    try {
        const client = await gasesteClient(id);
        const masina = client.masini.find(masina => masina.nrInmatriculare === nrInmatriculare);
        if (!masina) {
            return res.status(404).json({ error: "Mașina nu a fost găsită" });
        }
        for (const key in dateUpdatate) {
            if (dateUpdatate.hasOwnProperty(key)) {
                masina[key] = dateUpdatate[key];
            }
        }
        await editareClient(id, { masini: client.masini });
        res.status(200).json({ message: "Datele mașinii au fost actualizate", masina });
    } catch (error) {
        eroare(error, res);
    }
});

// Editarea partiala a programarii
app.patch("/programari/:id", async (req, res) => {
    const id = req.params.id;
    const dateUpdatate = req.body;

    try {
        const programare = await gasesteProgramare(id);
        for (const key in dateUpdatate) {
            if (dateUpdatate.hasOwnProperty(key)) {
                programare[key] = dateUpdatate[key];
            }
        }
        await editareProgramare(id, programare);
        res.status(200).json({ message: "Datele programării au fost actualizate", programare });
    } catch (error) {
        eroare(error, res);
    }
});

// editarea parțială a feedback-ului
app.patch("/feedback/:programareId", async (req, res) => {
    const programareId = req.params.programareId;
    const dateUpdatate = req.body;
    try {
        const feedback = await gasesteFeedback(programareId);
        for (const key in dateUpdatate) {
            if (dateUpdatate.hasOwnProperty(key)) {
                feedback[key] = dateUpdatate[key];
            }
        }
        await editareFeedback(programareId, feedback);
        res.status(200).json({ message: "Datele feedback-ului au fost actualizate", feedback });
    } catch (error) {
        eroare(error, res);
    }
});


// Editare client
app.put("/clienti/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await editareClient(id, req.body);
        res.status(200).json({ message: "Datele clientului au fost actualizate" });
    } catch (error) {
        eroare(error, res);
    }
});

// Editare mașină pentru client
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
        eroare(error, res);
    }
});


// Editare programare
app.put("/programari/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await editareProgramare(id, req.body);
        res.status(200).json({ message: "Datele programării au fost actualizate" });
    } catch (error) {
        eroare(error, res);
    }
});

// Editare feedback
app.put("/feedback/:programareId", async (req, res) => {
    const programareId = req.params.programareId;
    try {
        await editareFeedback(programareId, req.body);
        res.status(200).json({ message: "Datele feedback-ului au fost actualizate" });
    } catch (error) {
        eroare(error, res);
    }
});


// Ștergere client
app.delete("/clienti/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await stergeClient(id);
        res.status(200).json({ message: "Client șters" });
    } catch (error) {
        eroare(error, res);
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
        eroare(error, res);
    }
});

// Ștergere programare
app.delete("/programari/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await stergeProgramare(id);
        res.status(200).json({ message: "Programare ștearsă" });
    } catch (error) {
        eroare(error, res);
    }
});

// Ștergere feedback
app.delete("/feedback/:programareId", async (req, res) => {
    const programareId = req.params.programareId;
    try {
        await stergeFeedback(programareId);
        res.status(200).json({ message: "Feedback șters" });
    } catch (error) {
        eroare(error, res);
    }
});

// Initializarea bazei de date si pornirea serverului
app.listen(port, async () => {
    try {
        await initializareBaza();
        console.log(`Serverul a pornit pe portul ${port}`);
    } catch (error) {
        console.error("Eroare la pornirea serverului:", error);
    }
});

// Functii

// Functie de initializare a bazei de date
async function initializareBaza() {
    try {
        if (!await db.exists("/clienti")) {
            await db.push("/clienti", []);
        }
        if (!await db.exists("/programari")) {
            await db.push("/programari", []);
        }
        if (!await db.exists("/feedback")) {
            await db.push("/feedback", []);
        }
    } catch (error) {
        console.error("Eroare la initializarea bazei de date:", error);
        throw error;
    }
}
// Verificarea matricei
async function verificareArray(ar) {
    if (!Array.isArray(ar)) {
        ar = [];
    }
    return ar;
}

// Verificarea datellor clientilor existenti în baza.json
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

// Verificarea datelor programarilor existente în baza.json
async function verificaDateProgramari() {
    try {
        let programariExistente = db.getData("/programari");
        await verificareArray(programariExistente);
    } catch (error) {
        console.error("Nu există date în fișierul baza.json");
        }
    return;
}



// Verificarea datelor feedback-ului existente în baza.json
async function verificaDateFeedback() {
    try {
        let feedbackExistent = db.getData("/feedback");
        await verificareArray(feedbackExistent);
    } catch (error) {
        console.error("Nu există date în fișierul baza.json");
        }
    return;
}


// Functie de a valida intervalul orar a programarii
async function intervalValid(ora) {
    const oraProgramare = ora.split(":");
    if (oraProgramare[1] > 0) {
        oraProgramare[0]++;
    }
    if (oraProgramare[0] < 8 || oraProgramare[0] > 17) {
        return false;
    }
    return true;
}


// Functie de găsire a unui client după ID
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

// Functie de găsire a unei programari după ID
async function gasesteProgramare(programareId) {
    try {
        const programari = await db.getData("/programari");
        const programareGasita = programari.find(programare => programare.id === programareId);
        if (!programareGasita) {
            throw new Error("Programarea nu a fost găsit");
        }
        return programareGasita;
    } catch (error) {
        console.error("Eroare la găsirea programarii:", error);
        throw error;
    }
}

// Functie de găsire a unui feedback după ID-ul programarii
async function gasesteFeedback(programareId) {
    try {
        const feedback = await db.getData("/feedback");
        const feedbackGasit = feedback.find(feedback => feedback.programareId === programareId);
        if (!feedbackGasit) {
            throw new Error("Feedback-ul nu a fost găsit");
        }
        return feedbackGasit;
    } catch (error) {
        console.error("Eroare la găsirea feedback-ului:", error);
        throw error;
    }
}


// Functie de salvare a unui client în baza de date
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

// Functie de salvare a unei programări în baza de date
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

// Functie de salvare a unui feedback în baza de date
async function salvareFeedback(feedback) {
    try {
        let feedbackExistent = await db.getData("/feedback");
        await verificareArray(feedbackExistent);
        feedbackExistent.push(feedback);
        db.push("/feedback", feedbackExistent, true);
    } catch (error) {
        console.error("Eroare la salvarea feedback-ului:", error);
        throw error;
    }

}

// Functie de afișare a clienților
async function afisareClienti() {
    try {
        const clienti = await db.getData("/clienti");
        return clienti;
    } catch (error) {
        console.error("Eroare la afișarea clienților:", error);
        throw error;
    }
}

// Functie de afișare a programărilor
async function afisareProgramari() {
    try {
        const programari = await db.getData("/programari");
        return programari;
    } catch (error) {
        console.error("Eroare la afișarea programărilor:", error);
        throw error;
    }
}

// Functie de afișare a feedback-ului
async function afisareFeedback() {
    try {
        const feedback = await db.getData("/feedback");
        return feedback;
    } catch (error) {
        console.error("Eroare la afișarea feedback-ului:", error);
        throw error;
    }
}

// Functie de editare a datelor unui client
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

// Functie de editare a datelor unei programări
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

// Functie de editare a datelor unui feedback
async function editareFeedback(programareId, dateUpdatate) {
    try {
        let feedback = await db.getData("/feedback");
        await verificareArray(feedback);
        const index = feedback.findIndex(feedback => feedback.programareId === programareId);
        if (index !== -1) {
            feedback[index] = { ...feedback[index], ...dateUpdatate };
            db.push("/feedback", feedback, true);
        } else {
            throw new Error("Feedback-ul nu a fost găsit");
        }
    } catch (error) {
        console.error("Eroare la editarea datelor feedback-ului:", error);
        throw error;
    }
}

// Functie de ștergere a unui client
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


// Functie de ștergere a unei programări
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

// Functie de ștergere a unui feedback
async function stergeFeedback(programareId) {
    try {
        let feedback = await db.getData("/feedback");
        await verificareArray(feedback);
        feedback = feedback.filter((feedback) => feedback.programareId !== programareId);
        db.push("/feedback", feedback, true);
    } catch (error) {
        console.error("Eroare la ștergerea feedback-ului:", error);
        throw error;
    }
}

// Funcție pentru a trata erorile
function eroare(error, res) {
    console.error("Eroare:", error);
    res.status(500).json({ error: "Eroare internă" });
}