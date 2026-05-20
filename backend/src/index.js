import express from "express";
import bodyParser from "body-parser";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import path from "node:path";
import { fileURLToPath } from "node:url";
import session from "express-session";

export const app = express();
const port = 3000;
export const db = new Database("users.db", { verbose: console.log });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		secret: "keyboard cat",
		resave: false,
		saveUninitialized: true,
	}),
);
const allowedURLs = ["/login.html", "/login.css", "/style.css"];
app.use((req, res, next) => {
	if (
		allowedURLs.includes(req.path) ||
		req.path.startsWith("/api") ||
		(req.session.user && req.session.userID)
	) {
		if (req.path === "/login.html" && req.session.user && req.session.userID) {
			res.redirect("/user.html?username=" + req.session.user);
		} else next();
	} else {
		console.log("baseurl: ", req.path);
		res.redirect("/login.html");
	}
});

app.use(express.static(path.join(__dirname, "../../frontend/public")));

function isAuthenticated(req, res, next) {
	if (req.session.user && req.session.userID) next();
	else {
		res.status(401).send("Unauthorized");
		next("route");
	}
}
function isAuthorized(req, requiredPermissions) {
	let stmt = db.prepare("SELECT type FROM users WHERE id==(?)");
	const userType = stmt.get(req.session.userID);
	console.log("User type: ", userType);
	console.log(req.session, "req.session");
	if (userType.type === "admin") return true;
	if (!requiredPermissions.isInteger && requiredPermissions !== "admin")
		return false;
	else if (!requiredPermissions.isInteger && requiredPermissions === "admin")
		return true;
	else if (userType.type !== "admin") {
		console.log(requiredPermissions);
		stmt = db.prepare(
			"SELECT permission FROM `permissions` WHERE user_id = (?) AND project_id = (?);",
		);
		const perm = stmt.run(req.session.userID, req.body.projectID).permission;
		if (!perm || perm === 0) return false;
		else if (perm < requiredPermissions) return false;
		else return true;
	} else return true;
}
function permissionsLevel(req) {
	let stmt = db.prepare("SELECT type FROM users WHERE id==(?)");
	const projectID = req.session.userID || req.query.id;
	console.log("projectID: ", projectID);
	const userType = stmt.get(req.session.userID).type;
	if (userType === "admin") return 7;
	else {
		console.log("req.body: ", req);
		stmt = db.prepare(
			"SELECT permission FROM 'permissions' WHERE user_id = (?) AND project_id = (?);",
		);
		const perm = stmt.run(req.session.userID, projectID).permission;
		return perm || 0;
	}
}
app.get("/", isAuthenticated, function (req, res) {
	res.redirect("/user.html?username=" + req.session.user);
});

app.get("/", function (req, res) {
	res.redirect("/login.html");
});

app.post("/api/login", async function (req, res) {
	if (!req.body.user || !req.body.pass)
		return res.redirect("/login.html?err=wrongpassword");
	getUserData("users", req.body.user).then((result) => {
		const user = result;

		if (user) {
			isPasswordCorrect(req.body.pass, user.password)
				.then((result) => {
					if (!result) res.redirect("/?err=wrongpassword");
					else {
						req.session.regenerate(function (err) {
							if (err) next(err);

							req.session.user = req.body.user;
							req.session.userID = user.id;

							req.session.save(function (err) {
								if (err) return next(err);
								res.redirect("/");
							});
						});
					}
				})
				.catch((err) => {
					console.log(err);
					res.redirect("/?err=wrongpassword");
				});
		} else res.redirect("/?err=wrongpassword");
	});
});

app.post("/api/register", function (req, res) {
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
// app.use(express.static('public')) move to the earlier line
app.get("/api/logout", function (req, res, next) {
	req.session.user = null;
	req.session.save(function (err) {
		if (err) next(err);

		req.session.regenerate(function (err) {
			if (err) next(err);
			res.redirect("/");
		});
	});
});

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});

async function getUserData(tableName, username) {
	return new Promise((resolve, reject) => {
		const stmt = db.prepare("select * from users where username = (?)");
		resolve(stmt.get(username));
	});
}

function isPasswordCorrect(password, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, hash, (err, result) => {
			if (err) return reject(err);
			resolve(result);
		});
	});
}
app.get("/api/projectPermission", isAuthenticated, function (req, res) {
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
			.json("User has no permission to this project or no project found!");

	console.log(res.status(200).send(permission));
});
app.get("/api/project", isAuthenticated, async function (req, res) {
	const stmt = db.prepare(
		"SELECT permission FROM `permissions` WHERE user_id = ? AND project_id = ?",
	);
	if (!req.query.id) return res.json("Bad request");
	const perms = stmt.get(1, req.query.id);
	const permissions = permissionsLevel(req);
	//Przeonoszenie na stronę projektu linkiem
	console.log("Permissions: ", permissions);
	if (perms.permission !== 0) {
		let stmt = db.prepare("select * from Project where id = (?)");
		const project = stmt.get(req.query.id);
		stmt = db.prepare(
			"select products.id, products.name, products.mark, product_prices.price, product_prices.currency, project_products.number from `products` inner join project_products on project_products.product_id = products.id join `Project` on project_products.project_id = project.id join `product_prices` on products.id = product_prices.product_id  where project.id = (?) and product_prices.pricing_list_id = (?)",
		);
		const items = stmt.all(req.query.id, project.shrack_pricing_list_id);
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
	} else res.redirect("/?err=noPermissions");
});
app.post("/api/project/archive", isAuthenticated, async function (req, res) {
	if (!req.body || !req.body.projectID || !req.body.archived)
		return res.status(400).send("Bad request");
	isAuthorized(req, 7);
	const stmt = db.prepare("UPDATE Project SET archived = (?) WHERE id = (?)");
	if (stmt.run(req.body.archived, req.body.projectID))
		res.status(200).send("ok");
	else res.status(500).send("Internal server error!");
});
app.get("/api/project/pricingList", isAuthenticated, async function (req, res) {
	const stmt = db.prepare(
		"SELECT *, (select Project.shrack_pricing_list_id from project where id = (?)) as inUse FROM shrack_cennik ;",
	);
	res.json(stmt.all(req.query.id));
});
app.get("/api/getProducts", isAuthenticated, async function (req, res) {
	let stmt = db.prepare("SELECT * FROM `products`");
	const products = stmt.all();
	stmt = db.prepare("SELECT * FROM `project_products`");
	const usedProducts = stmt.all();
	// products.forEach((element)=>{
	//     if(usedProducts.find(o => o.product_id === element.id)){
	//         element.inUse = true;
	//     }
	// })
	res.send(products);
});
app.get("/api/getProjects", isAuthenticated, (req, res) => {
	let stmt = db.prepare(
		"select project.id, project.name, project.archived, permissions.permission from `project` inner join `permissions` on permissions.project_id = project.id where permissions.user_id = (?) and permissions.permission > 0;",
	);
	res.send(stmt.all(JSON.stringify(req.session.userID)));
});
app.post("/api/createProject", isAuthenticated, async function (req, res) {
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
	stmt.run(req.session.userID, 7, projectID);
	res.redirect("/project/index.html?id=" + projectID);
});
app.post(
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
app.post("/api/project/deleteItem", isAuthenticated, async function (req, res) {
	if (!isAuthorized(req, 2)) return res.status(401).send("No permissions.");
	if (!req.body.projectID || !req.body.productID) return;
	const stmt = db.prepare(
		"DELETE from `project_products` WHERE project_id = (?) AND product_id = (?)",
	);
	stmt.run(req.body.projectID, req.body.productID);
	res.sendStatus(200);
});
app.post(
	"/api/project/addNewelement",
	isAuthenticated,
	async function (req, res) {
		if (!isAuthorized(req, 2)) return res.status(401).send("No permissions.");
		if (!req.body.number || !req.body.productID)
			return res.status(400).send("Bad request.");
		if (!req.body.projectID || !req.body.productID) return;
		if (req.body.number <= 0 || typeof req.body.number !== "number")
			return res.status(400).send("Invalid amount.");
		const stmt = db.prepare(
			"INSERT INTO `project_products` (project_id, product_id, number) VALUES (?, ?, ?)",
		);
		console.log(
			stmt.run(req.body.projectID, req.body.productID, req.body.amount || 1),
		);
		res.status(200).send("ok");
	},
);
app.post("/api/project/updateItem", isAuthenticated, async function (req, res) {
	if (!isAuthorized(req, 2)) return res.status(401).send("No permissions.");
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
});
app.post("/api/project/newProject", isAuthenticated, async function (req, res) {
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
});

app.get("/api/magazyn", (req, res) => {
	let rows;
	let table;
	db.all("SELECT nazwa, cena, znacznik FROM produkty", function (err, allRows) {
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
	});
});
