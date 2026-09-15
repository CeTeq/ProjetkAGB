import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/api/magazyn", (req, res) => {
    let rows;
    let table;
    db.all(
        "SELECT nazwa, cena, znacznik FROM produkty",
        function (err, allRows) {
            if (err != null) {
                console.log(err);
            }
            rows = allRows;
            table =
                "<table><tr><th>Nazwa produktu</th><th>Ilość</th><th>Cena</th></tr>";
            rows.forEach((element) => {
                table +=
                    "<tr><td>" +
                    element.Nazwa_produktu +
                    '</td><td class="cent">' +
                    element.Znacznik_produktu +
                    '</td><td class="cent">' +
                    element.Cena_produktu * element.Ilość_produktu +
                    "zł" +
                    "</td></tr>";
            });
            table += "</table>";
            res.send(table);
        },
    );
});

export default router;
