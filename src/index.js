import express from 'express';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import session from 'express-session';
// import {pricingList} from "./pricingList.js";
// import {all} from "express/lib/application.js";

export const app = express();
const port = 3000;
export const db = new Database('users.db', { verbose: console.log });

const __filename = fileURLToPath(import.meta.url);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
const allowedURLs = ['/login.html', '/login.css', '/styles.css']
app.use((req, res, next) => {
    if ((allowedURLs.includes(req.path) || req.path.startsWith('/api') )|| (req.session.user && req.session.userID)) {
        if (req.path === '/login.html' && (req.session.user && req.session.userID)) {
            res.redirect('/user.html?username=' + req.session.user)
        } else next();
    } else {
        console.log('baseurl: ', req.path);
        res.redirect('/login.html')
    }
})
app.use(express.static('public'))

function isAuthenticated(req, res, next) {
    if (req.session.user && req.session.userID) next();
    else next('route');
}

app.get('/', isAuthenticated, function (req, res) {
    // const filePath = path.resolve('./public/user.html');
    // res.sendFile(filePath);
    res.redirect('/user.html?username=' + req.session.user);
});

app.get('/', function (req, res) {
    // const filePath = path.resolve('./public/index.html');
    // res.sendFile(filePath);
    res.redirect('/login.html')
});

app.post('/api/login', async function (req, res) {
    if(!req.body.user || !req.body.pass) return res.redirect('/login.html?err=wrongpassword');
    getUserData('users', req.body.user)
        .then(result => {
            const user = result;

            if (user) {
                isPasswordCorrect(req.body.pass, user.password)
                    .then(result => {
                        if (!result) res.redirect('/?err=wrongpassword');
                        else {
                            req.session.regenerate(function (err) {
                                if (err) next(err);

                                req.session.user = req.body.user;
                                req.session.userID = user.id;

                                req.session.save(function (err) {
                                    if (err) return next(err);
                                    res.redirect('/');
                                });
                            });
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect('/?err=wrongpassword');
                    });
            } else res.redirect('/?err=wrongpassword');
        });
});

app.post('/api/register', function (req, res) {
    if(!req.body.user || !req.body.pass) return res.redirect('/login.html?err=wrongpassword');
    bcrypt.genSalt(10, async function (err, salt) {
        await bcrypt.hash(req.body.pass, salt, function (err, hash) {
            const dsa = db.prepare("select * from users where username = (?)");
            if (dsa.get(req.body.user) === undefined) {
                let stmt = db.prepare('INSERT INTO users (username, password) VALUES (?,?)');
                stmt.run(req.body.user, hash)
                stmt = db.prepare("select MAX(id) as id from users")
                const userID = stmt.get()
                req.session.regenerate(function (err) {
                    if (err) next(err);

                    req.session.user = req.body.user;
                    req.session.userID = userID;
                    req.session.save(function (err) {
                        if (err) return next(err);
                        res.redirect('/user.html');
                    });
                });
            } else res.redirect('/login.html');
        });
    });
});

app.get('/api/logout', function (req, res, next) {
    req.session.user = null;
    req.session.save(function (err) {
        if (err) next(err);

        req.session.regenerate(function (err) {
            if (err) next(err);
            res.redirect('/');
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

app.get('/api/project', isAuthenticated, async function (req, res) {
    const stmt = db.prepare("SELECT permission FROM `permissions` WHERE user_id = ? AND project_id = ?");
    const perms = stmt.get(1, req.query.id);

    if (perms.permission !== 0) {
        let stmt = db.prepare("select * from Project where id = (?)");
        const project = stmt.get(req.query.id);
        stmt = db.prepare('select products.id, products.name, products.mark, product_prices.price, product_prices.currency, project_products.number from `products` inner join project_products on project_products.product_name = products.name inner join `Project` on project_products.project_id = project.id inner join `product_prices` on products.id = product_prices.product_id  where project.id = (?) and product_prices.pricing_list_id = (?)');
        const items = stmt.all(req.query.id, project.shrack_pricing_list_id)
        stmt = db.prepare('SELECT * FROM `order` where project_id=(?)')
        const order = stmt.get(project.id);
        console.log('items: ', items)
        if(perms.permission > 0){
            res.json({
                id: project.id,
                name: project.name,
                client: order,
                items: items
            })
        }
    } else res.redirect('/?err=noPermissions');
});
app.get('/api/pricingList', isAuthenticated, async function (req, res) {
    const stmt = db.prepare("SELECT *, (select Project.shrack_pricing_list_id from project where id = (?)) as inUse FROM shrack_cennik ;")
    res.json(stmt.all(req.query.id));
})
app.post('/api/setPricingList', isAuthenticated, async function (req, res) {
    let stmt = db.prepare('UPDATE `Project` SET shrack_pricing_list_id = (?) where id = (?)');
    console.log(req.body)
    stmt.run(req.body.pricingList, req.body.projectID)
    res.sendStatus(200)
})

app.get('/api/magazyn', (req, res) => {
    let rows
    let table
    db.all("SELECT nazwa, cena, znacznik FROM produkty", function(err, allRows) {
        if(err != null){
            console.log(err);
        }
        rows = allRows
        table = "<table><tr><th>Nazwa produktu</th><th>Ilość</th><th>Cena</th></tr>"
        rows.forEach((element)=>{
            table+= '<tr><td>' + element.Nazwa_produktu + '</td><td class="cent">' + element.Znacznik_produktu + '</td><td class="cent">' + element.Cena_produktu * element.Ilość_produktu + 'zł' + '</td></tr>'
        })
        table += '</table>'
        res.send(table)
    });
})
app.get('/api/getProjects', isAuthenticated, (req, res) => {
    let stmt = db.prepare("select project.id, project.name, permissions.permission from `project` inner join `permissions` on permissions.project_id = project.id where permissions.user_id = (?) and permissions.permission > 0");
    res.send(stmt.all(JSON.stringify(req.session.userID)))
})
