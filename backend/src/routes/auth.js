import { Router } from "express";
import { db } from "../db.js";
import bcrypt from "bcrypt";
import { isAuthenticated } from "../middleware/auth.js";
import { getUserData, isPasswordCorrect } from "../utils/helpers.js";

const router = Router();

router.post("/api/login", async function (req, res, next) {
    if (!req.body.user || !req.body.pass)
        return res.status(400).json({ error: "Invalid username or password" });
    try {
        const user = await getUserData("users", req.body.user);
        if (!user)
            return res
                .status(401)
                .json({ error: "Invalid username or password" });
        const isMatch = await isPasswordCorrect(req.body.pass, user.password);
        if (!isMatch)
            return res
                .status(401)
                .json({ error: "Invalid username or password" });

        return req.session.regenerate(function (err) {
            if (err) next(err);
            req.session.user = req.body.user;
            req.session.userID = user.id;
            req.session.save(function (err) {
                if (err) return next(err);
                res.sendStatus(200);
            });
        });
    } catch (error) {
        console.log(error);
        return next(error);
    }
});

router.post("/api/register", function (req, res) {
    if (!req.body.user || !req.body.pass)
        return res.redirect("/login.html?err=wrongpassword");
    bcrypt.genSalt(10, async function (err, salt) {
        await bcrypt.hash(req.body.pass, salt, function (err, hash) {
            const dsa = db.prepare("select * from users where username = (?)");
            if (dsa.get(req.body.user) === undefined) {
                let stmt = db.prepare(
                    "INSERT INTO users (username, password) VALUES (?,?)",
                );
                stmt.run(req.body.user, hash);
                stmt = db.prepare("select MAX(id) as id from users");
                const userID = stmt.get();
                req.session.regenerate(function (err) {
                    if (err) next(err);

                    req.session.user = req.body.user;
                    req.session.userID = userID;
                    req.session.save(function (err) {
                        if (err) return next(err);
                        res.redirect("/user.html");
                    });
                });
            } else res.redirect("/login.html");
        });
    });
});
router.get("/api/logout", function (req, res, next) {
    req.session.user = null;
    req.session.save(function (err) {
        if (err) next(err);

        req.session.regenerate(function (err) {
            if (err) next(err);
            res.redirect("/");
        });
    });
});
router.get("/api/me", isAuthenticated, function (req, res, next) {
    if (!req.session.user) return res.sendStatus(400);
    res.send(req.session.user);
});

export default router;
