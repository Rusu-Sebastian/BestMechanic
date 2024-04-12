function addCarForm() {
    var numMasini = document.getElementById("nrMasini").value;
    var formContainer = document.getElementById("carForms");
    
    // Create car data forms based on the number of cars
    for (var i = 0; i < numMasini; i++) {
        var carForm = document.createElement("div");
        carForm.innerHTML = `
            <h2>Date mașină ${i + 1}</h2>
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
        `;
        if (i == 1) {
            // Add an identifier to the second form
            carForm.querySelector("form").id = "secondForm";
        } else {
            // Prevent default form submission for other forms
            carForm.querySelector("form").addEventListener("submit", function(event) {
                event.preventDefault();
            });
        }
        formContainer.appendChild(carForm);
    }
}