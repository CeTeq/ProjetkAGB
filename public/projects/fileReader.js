const fileInput = document.getElementById("file-input");
const fileContentDisplay = document.getElementById("file-content");
const messageDisplay = document.getElementById("message");
let input

fileInput.addEventListener("change", handleFileSelection);

function handleFileSelection(event) {
    const file = event.target.files[0];
    fileContentDisplay.textContent = ""; // Clear previous file content
    messageDisplay.textContent = ""; // Clear previous messages

    // Validate file existence and type
    if (!file) {
        showMessage("No file selected. Please choose a file.", "error");
        return;
    }

    if (!file.type.startsWith("text/csv")) {
        showMessage("Unsupported file type. Please select a csv file.", "error");
        return;
    }

    // Read the file
    const reader = new FileReader();
    reader.onload = () => {
        // fileContentDisplay.textContent = reader.result;
        input = convertCSVToArray(reader.result, ';')
        if(validateInput(input) === true) {
            showMessage("File loaded correctly.", "message")
            arraysToTable(input)
            fetch('/nowyCennik', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            })
        }
        else showMessage("File is not valid.", "error")
        console.log(input)
    };
    reader.onerror = () => {
        showMessage("Error reading the file. Please try again.", "error");
    };
    reader.readAsText(file);
}

// Displays a message to the user
function showMessage(message, type) {
    messageDisplay.textContent = message;
    messageDisplay.style.color = type === "error" ? "red" : "green";
}


function convertCSVToArray(strData, strDelimiter) {
    strDelimiter = strDelimiter || ",";
    var objPattern = new RegExp(
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        "([^\"\\" + strDelimiter + "\\r\\n]*))",
        "gi"
    );
    var arrData = [[]];
    var arrMatches = null;
    while (arrMatches = objPattern.exec(strData)) {
        var strMatchedDelimiter = arrMatches[1];
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
            arrData.push([]);
        }
        var strMatchedValue;
        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
        } else {
            strMatchedValue = arrMatches[3];
        }
        arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData;
}

function validateInput(input) {
    let correct = true
    input.pop()
    input.forEach((element, i)=>{
        if(correct !== true) console.log(correct)
        else element.forEach((column, j)=>{
            if(i === 0){ if(element.length > 3 || element[0] !== 'Produkt' || element[1] !== 'Znacznik' || element[2] !== 'Cena detaliczna') {
                correct = "Nie odpowiednie nagłówki kolumn" + i
                console.log(element[0])
            }
            }
            else if(i !== 0) {
                console.log(column.length === 3)
                if (j > 2) {
                    correct = "Zbyt duża ilość kolumn." + i + column.length
                }
                else if(j === 0 && column === "") {
                    correct = "Zły typ kolumna 1." + i
                }
                else if(j === 1 && column === "") {
                    correct = "Zły typ danych kolumna 2." + i
                }
                else if(j === 2 && (!column || !isNumeric(column))) {
                    correct = "Zły typ danych kolumna 3." + i
                }
            }
        })
    })
    if (correct !== true) console.log(correct)
    return correct
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function arraysToTable(array) {
    let table
    array.forEach((element, i) => {
        if(i === 0) {
            table = '<table><tr><th>' + element[0] + '</th><th>' + element[1] + '</th><th>' + element[2] + '</th></tr>'
        }
        else {
            table += '<tr><td>' + element[0] + '</td><td>' + element[1] + '</td><td>' + element[2] + '</td></tr>'
        }
    })
    table += '</table>'
    console.log(table)
    document.querySelector('#table').innerHTML = table
}
