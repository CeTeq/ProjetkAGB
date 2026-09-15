const allowedURLs = ["/login.html", "/login.css", "/style.css"];
export function sessionGuard(req, res, next) {
    if (
        allowedURLs.includes(req.path) ||
        req.path.startsWith("/api") ||
        (req.session.user && req.session.userID)
    ) {
        if (
            req.path === "/login.html" &&
            req.session.user &&
            req.session.userID
        ) {
            res.redirect("/user.html?username=" + req.session.user);
        } else next();
    } else {
        console.log("baseurl: ", req.path);
        res.redirect("/login.html");
    }
}

export function isAuthenticated(req, res, next) {
    console.log("Is authenticated:", req.session);
    if (req.session.user && req.session.userID) next();
    else {
        res.status(401).send("Unauthorized");
        next("route");
    }
}
