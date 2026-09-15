import { Router } from "express";
import { db } from "../db.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

router.post("/nowyCennik", (req, res) => {
    if (!req.body) {
        res.statusCode = 400;
        res.send("Invalid body");
        return;
    }
    res.send("OK");
    let cennik = req.body;
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
                    let iDProduktu = await getNextId("Produkty", "Id_produktu");

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

router.get(
    "/api/project/pricingList",
    isAuthenticated,
    async function (req, res) {
        const stmt = db.prepare(
            "SELECT *, (select Project.shrack_pricing_list_id from project where id = (?)) as inUse FROM shrack_cennik ;",
        );
        res.json(stmt.all(req.query.id));
    },
);

router.post(
    "/api/project/setPricingList",
    isAuthenticated,
    async function (req, res) {
        let stmt = db.prepare(
            "UPDATE `Project` SET shrack_pricing_list_id = (?) where id = (?)",
        );
        console.log(req.body);

        stmt.run(req.body.pricingList, req.body.projectID);
        res.sendStatus(200);
    },
);

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
    return correct;
}

function isNumeric(str) {
    if (typeof str != "string") return false;
    return (
        !isNaN(str) &&
        !isNaN(parseFloat(str))
    );
}

async function getNextId(tableName, rowName) {
    return new Promise((resolve, reject) => {
        db.get(`select MAX(${rowName}) from ${tableName}`, (err, row) => {
            if (err) return reject(err);
            resolve(row[`MAX(${rowName})`] + 1);
        });
    });
}

export default router;
