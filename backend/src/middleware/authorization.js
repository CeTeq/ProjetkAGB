import { db } from "../db.js";

export function isAuthorized(req, requiredPermissions) {
    let stmt = db.prepare("SELECT type FROM users WHERE id==(?)");
    const userType = stmt.get(req.session.userID);

    console.log("User type: ", userType);
    console.log(req.session, "req.session");

    if (userType.type === "admin") return true;

    if (requiredPermissions === "admin") return false;

    const projectID = req.body.projectID;
    if (!projectID) return false;

    const permStmt = db.prepare(
        "SELECT permission FROM `permissions` WHERE user_id = (?) AND project_id = (?);",
    );
    try {
        const permRecord = permStmt.get(req.session.userID, projectID);
        if (!permRecord || !permRecord.permission) return false;
        return permRecord.permission >= requiredPermissions;
    } catch (error) {
        if (!permRecord || !permRecord.permission) return false;
    }
}
export function permissionsLevel(req) {
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
