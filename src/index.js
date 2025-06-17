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
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static('public'))


const stmt = db.prepare("select * from users where username = 'admin'");
console.log(stmt.get());

function isAuthenticated(req, res, next) {
    if (req.session.user && req.session.userID) next();
    else next('route');
}

app.get('/', isAuthenticated, function (req, res) {
    // const filePath = path.resolve('./public/user.html');
    // res.sendFile(filePath);
    res.redirect('/user.html')
});

app.get('/', function (req, res) {
    // const filePath = path.resolve('./public/index.html');
    // res.sendFile(filePath);
    res.redirect('/login.html')
});

app.post('/login', async function (req, res) {
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
                                console.log('result: ', user.id);
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

app.post('/register', function (req, res) {
    bcrypt.genSalt(10, async function (err, salt) {
        await bcrypt.hash(req.body.pass, salt, function (err, hash) {
            const dsa = db.prepare("select * from users where username = (?)");
            if (dsa.get(req.body.user) === undefined) {
                let stmt = db.prepare('INSERT INTO users (username, password, salt) VALUES (?,?,?)');
                console.log(stmt.run(req.body.user, hash, salt));
                stmt = db.prepare("select MAX(id) as id from users")

                console.log('register id: ', stmt.get())

                req.session.regenerate(function (err) {
                    if (err) next(err);

                    req.session.user = req.body.user;

                    req.session.save(function (err) {
                        if (err) return next(err);
                        res.redirect('/');
                    });
                });
            } else res.redirect('/');
        });
    });
});

app.get('/logout', function (req, res, next) {
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

app.get('/project', isAuthenticated, async function (req, res) {
    const stmt = db.prepare("SELECT permission FROM `permissions` WHERE user_id = ? AND project_id = ?");
    const perms = stmt.all(1, req.query.id);

    if (perms[0].permission !== 0) {
        const stmt = db.prepare("select * from Project where id = (?)");
        const project = stmt.get(req.query.id);
        res.send('<h1>Welcome</h1>');
        console.log('req session user: ', req.session.userID)
    } else res.redirect('/?err=noPermissions');
});

app.get('/magazyn', (req, res) => {
    let rows
    let table
    db.all("SELECT nazwa, cena, znacznik FROM produkty", function(err, allRows) {

        if(err != null){
            console.log(err);
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
    console.log(req)
    let stmt = db.prepare("select project.id, project.name, permissions.permission from `project` inner join `permissions` on permissions.project_id = project.id where permissions.user_id = (?) and permissions.permission > 0");
    res.send(stmt.all(JSON.stringify(req.session.userID)))
})
