import Database from "better-sqlite3";
export const db = new Database("users.db", { verbose: console.log });
