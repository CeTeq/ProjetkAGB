import { db } from "../db.js";
import bcrypt from "bcrypt";

export async function getUserData(tableName, username) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("select * from users where username = (?)");
        resolve(stmt.get(username));
    });
}

export function isPasswordCorrect(password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}
