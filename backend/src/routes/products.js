import { Router } from "express";
import { db } from "../db.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

router.get("/api/getProducts", isAuthenticated, async function (req, res) {
    const stmt = db.prepare("SELECT * FROM `products`");
    const products = stmt.all();
    res.send(products);
});

export default router;
