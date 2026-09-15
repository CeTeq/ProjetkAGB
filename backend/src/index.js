import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sessionGuard } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import productRoutes from "./routes/products.js";
import pricingListRoutes from "./routes/pricingList.js";

const app = express();
const port = 3003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        origin: "http://" + process.env.DEV_IP + ":3000",
        credentials: true,
    }),
);
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: false,
    }),
);
app.use(sessionGuard);
app.use(express.static(path.join(__dirname, ".../public")));

app.use(authRoutes);
app.use(projectRoutes);
app.use(productRoutes);
app.use(pricingListRoutes);

app.listen(port, process.env.DEV_IP, () => {
    console.log(`Server running on http://localhost:${port}`);
});
