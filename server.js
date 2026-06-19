const express = require("express");
const cors = require("cors");
const nocache = require("nocache");
const mcp = require("minecraft-protocol");
const path = require("path");
const app = express();
const port = 3000;

app.use(cors());
app.use(nocache());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/ok", (req, res) => { res.send("ok"); });

const mcsip = "127.0.0.1"
const mcsport = 25565

app.get("/players", (req, res) => {
    console.log(`request to '/players' from ${req.ip}`)
    mcp.ping({ mcsip, mcsport }, (err, mcres) => {
        if (err) { return res.json({"error": "server down" }); }

        res.json(mcres);
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log("server up");
});

