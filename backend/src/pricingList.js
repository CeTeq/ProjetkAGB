import { app } from "./index.js";
import { db } from "./index.js";
export function pricingList() {
    app.post("/nowyCennik", (req, res) => {
        if (!req.body) {
            res.statusCode = 400;
            res.send("Invalid body");
            return;
        }
        res.send("OK");
        let cennik = req.body;
        // console.log(validateInput(cennik))
        // db.run(req.body.ok);
        let cennikID;
        getNextId("Shrack_cennik", "Id_cennika")
            .then((result) => {
                cennikID = result;
                console.log(cennikID);

                db.serialize(async () => {
                    db.run("BEGIN TRANSACTION");
                    const stmt = db.prepare(
                        "INSERT INTO Shrack_cennik (Id_cennika, Data_Dodania) VALUES (?,?)",
                    );
                    const products = db.prepare(
                        "INSERT INTO Produkty (Id_produktu, Nazwa_Produktu, Znacznik_Produktu, Cena_Produktu, Waluta, Id_cennika) VALUES (?,?,?,?,?,?)",
                    );
                    try {
                        const dateNow = new Date();
                        let date = [
                            dateNow.getDate(),
                            dateNow.getMonth(),
                            dateNow.getFullYear(),
                            dateNow.getHours(),
                            dateNow.getMinutes(),
                            dateNow.getSeconds(),
                        ];
                        date.forEach((d, i) => {
                            if (d < 10) date[i] = "0" + d;
                        });

                        stmt.run(
                            cennikID,
                            date[0] +
                                "-" +
                                date[1] +
                                "-" +
                                date[2] +
                                " " +
                                date[3] +
                                ":" +
                                date[4] +
                                ":" +
                                date[5],
                        );

                        console.log(cennik);
                        let iDProduktu = await getNextId(
                            "Produkty",
                            "Id_produktu",
                        );

                        cennik.forEach((element, i) => {
                            if (i !== 0) {
                                products.run(
                                    iDProduktu + i - 1,
                                    element[0],
                                    element[1],
                                    element[2],
                                    "PLN",
                                    cennikID,
                                );
                            }
                        });

                        db.run("COMMIT");
                    } catch (error) {
                        db.run("ROLLBACK");
                    } finally {
                        stmt.finalize();
                        products.finalize();
                    }
                });
            })
            .catch((err) => console.log(err));
    });
}

function validateInput(input) {
    let correct = true;
    input.pop();
    input.forEach((element, i) => {
        if (correct === true) {
            element.forEach((column, j) => {
                if (i === 0) {
                    if (
                        element.length > 3 ||
                        element[0] !== "Produkt" ||
                        element[1] !== "Znacznik" ||
                        element[2] !== "Cena detaliczna"
                    ) {
                        correct = "Nie odpowiednie nagłówki kolumn" + i;
                    }
                } else if (i !== 0) {
                    if (j > 2) {
                        correct = "Zbyt duża ilość kolumn." + i + column.length;
                    } else if (j === 0 && column === "") {
                        correct = "Zły typ rząd 1." + i;
                    } else if (j === 1 && column === "") {
                        correct = "Zły typ danych rząd 2." + i;
                    } else if (j === 2 && (!column || !isNumeric(column))) {
                        correct = "Zły typ danych rząd 3." + i;
                    }
                }
            });
        }
    });
    // if (correct !== true) console.log(correct)
    return correct;
}

function isNumeric(str) {
    if (typeof str != "string") return false; // we only process strings!
    return (
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
    ); // ...and ensure strings of whitespace fail
}

async function getNextId(tableName, rowName) {
    return new Promise((resolve, reject) => {
        db.get(`select MAX(${rowName}) from ${tableName}`, (err, row) => {
            if (err) return reject(err);
            resolve(row[`MAX(${rowName})`] + 1);
        });
    });
}
