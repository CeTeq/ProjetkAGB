import { Router } from "express";
import { db } from "../db.js";
import { isAuthenticated } from "../middleware/auth.js";
import { isAuthorized, permissionsLevel } from "../middleware/authorization.js";

const router = Router();

router.get("/api/projectPermission", isAuthenticated, function (req, res) {
    if (!req.query || !req.query.projectID)
        return res.status(400).json("Bad request");
    let stmt = db.prepare(
        "select `permission` from `permissions` where user_id = (?) AND project_id = (?);",
    );
    const permission = stmt.get(req.session.userID, req.query.projectID);
    console.log("Uprawnienia do projektu: ", permission);
    if (!permission)
        return res
            .status(404)
            .json(
                "User has no permission to this project or no project found!",
            );

    console.log(res.status(200).send(permission));
});
router.get("/api/project", isAuthenticated, async function (req, res) {
    const stmt = db.prepare(
        "SELECT permission FROM `permissions` WHERE user_id = ? AND project_id = ?",
    );
    if (!req.query.id) return res.json("Bad request");
    const perms = stmt.get(1, req.query.id);
    const permissions = permissionsLevel(req);

    console.log("Permissions: ", permissions);
    if (perms?.permission !== 0) {
        try {
            let stmt = db.prepare("select * from Project where id = (?)");
            const project = stmt.get(req.query.id);
            stmt = db.prepare(
                "select products.id, products.name, products.mark, product_prices.price, product_prices.currency, project_products.number from `products` inner join project_products on project_products.product_id = products.id join `Project` on project_products.project_id = project.id join `product_prices` on products.id = product_prices.product_id  where project.id = (?) and product_prices.pricing_list_id = (?)",
            );
            try {
                const items = stmt.all(
                    req.query.id,
                    project.shrack_pricing_list_id,
                );
                console.log(items);
                stmt = db.prepare("SELECT * FROM `order` where project_id=(?)");
                const order = stmt.get(project.id);
                console.log("items: ", items);
                if (perms.permission > 0) {
                    res.json({
                        id: project.id,
                        name: project.name,
                        client: order,
                        items: items,
                    });
                }
            } catch (error) {
                return res.redirect("/?err=noPermissions");
            }
        } catch (error) {
            return res.sendStatus(401);
        }
    } else return res.sendStatus(401);
});
router.post("/api/project/archive", isAuthenticated, async function (req, res) {
    if (!req.body || !req.body.projectID || !req.body.archived)
        return res.status(400).send("Bad request");
    isAuthorized(req, 7);
    const stmt = db.prepare("UPDATE Project SET archived = (?) WHERE id = (?)");
    if (stmt.run(req.body.archived, req.body.projectID))
        res.status(200).send("ok");
    else res.status(500).send("Internal server error!");
});
router.get("/api/getProjects", isAuthenticated, (req, res) => {
    let stmt = db.prepare(
        "select project.id, project.name, project.archived, permissions.permission from `project` inner join `permissions` on permissions.project_id = project.id where permissions.user_id = (?) and permissions.permission > 0;",
    );
    res.send(stmt.all(JSON.stringify(req.session.userID)));
});
router.post("/api/createProject", isAuthenticated, async function (req, res) {
    if (!isAuthorized(req, "admin"))
        return res.status(401).send("No permissions.");
    if (!req.body || !req.body.projectName)
        return res.status(400).send("Bad request");
    let stmt = db.prepare("INSERT INTO Project (name) VALUES (?)");
    stmt.run(req.body.projectName);
    stmt = db.prepare("SELECT id FROM `Project` ORDER BY id DESC LIMIT 1");
    const projectID = await stmt.run().lastInsertRowid;
    console.log(projectID, "project");
    stmt = db.prepare(
        "INSERT INTO permissions (user_id, permission, project_id) VALUES ((?), (?), (?))",
    );
    try {
        stmt.run(req.session.userID, 7, projectID);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

const removeProject = db.prepare("DELETE FROM Project WHERE id = (?)");
const removeItems = db.prepare(
    "DELETE FROM project_products WHERE project_id = (?)",
);
const removeOrder = db.prepare("DELETE FROM `order` WHERE project_id = (?)");
const removePermissions = db.prepare(
    "DELETE FROM permissions WHERE project_id = (?)",
);

const deleteProject = db.transaction((projectID) => {
    removeProject.run(projectID);
    removeItems.run(projectID);
    removeOrder.run(projectID);
    removePermissions.run(projectID);
});

router.post("/api/deleteProject", isAuthenticated, async (req, res) => {
    if (!req.body || !req.body.projectID) return res.sendStatus(400);
    if (!isAuthorized(req, "admin")) return res.sendStatus(401);
    try {
        deleteProject(req.body.projectID);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});
router.post(
    "/api/project/deleteItem",
    isAuthenticated,
    async function (req, res) {
        if (!isAuthorized(req, 2))
            return res.status(401).send("No permissions.");
        if (!req.body.projectID || !req.body.productID) return;
        const stmt = db.prepare(
            "DELETE from `project_products` WHERE project_id = (?) AND product_id = (?)",
        );
        stmt.run(req.body.projectID, req.body.productID);
        res.sendStatus(200);
    },
);
router.post(
    "/api/project/addNewelement",
    isAuthenticated,
    async function (req, res) {
        if (!isAuthorized(req, 2))
            return res.status(401).send("No permissions.");
        if (!req.body.number || !req.body.productID)
            return res.status(400).send("Bad request.");
        if (!req.body.projectID || !req.body.productID) return;
        if (req.body.number <= 0 || typeof req.body.number !== "number")
            return res.status(400).send("Invalid amount.");
        const stmt = db.prepare(
            "INSERT INTO `project_products` (project_id, product_id, number) VALUES (?, ?, ?)",
        );
        console.log(
            stmt.run(
                req.body.projectID,
                req.body.productID,
                req.body.amount || 1,
            ),
        );
        res.status(200).send("ok");
    },
);
router.post(
    "/api/project/updateItem",
    isAuthenticated,
    async function (req, res) {
        if (!isAuthorized(req, 2))
            return res.status(401).send("No permissions.");
        if (!req.body || !req.body.items)
            return res.status(400).send("Bad request. No items provided.");
        const stmt = db.prepare(
            "UPDATE `project_products` SET number = (?) where product_id = (?) and project_id = (?)",
        );
        console.log(req.body);
        req.body.items.forEach((item) => {
            stmt.run(item.amount, item.productID, item.projectID);
            console.log("Item: ", item);
        });
        res.status(200).send("ok");
    },
);
router.post(
    "/api/project/newProject",
    isAuthenticated,
    async function (req, res) {
        if (
            !req.body ||
            !req.body.name ||
            !req.body.street ||
            !req.body.street_number ||
            !req.body.post_code ||
            !req.body.city
        )
            return res.status(400).send("Bad request");
        if (!req.body.description) req.body.description = "Brak opisu";
        let stmt = db.prepare(
            "INSERT INTO Project (name, shrack_pricing_list_id) VALUES ((?), (SELECT id from shrack_cennik ORDER BY id DESC LIMIT 1));",
        );
        stmt.run(req.body.name);
        stmt = db.prepare(
            'INSERT INTO "order" (name, street, street_number, post_code, city, project_id, date, description) VALUES ((?), (?), (?), (?), (?), (SELECT id from Project ORDER BY id DESC LIMIT 1), (?), (?))',
        );
        stmt.run(
            req.body.name,
            req.body.street,
            req.body.street_number,
            req.body.post_code,
            req.body.city,
            req.body.date,
            req.body.description,
        );
        stmt = db.prepare(
            "INSERT INTO permissions (user_id, permission, project_id) VALUES ((?), 2, (SELECT id from Project ORDER BY id DESC LIMIT 1))",
        );
        stmt.run(req.session.userID);
        res.redirect("/");
    },
);

export default router;
