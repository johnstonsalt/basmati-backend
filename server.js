const express = require("express");
const cors = require("cors");
const nocache = require("nocache");
const mcp = require("minecraft-protocol");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 3000;

app.use(cors());
app.use(nocache());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/ok", (req, res) => { res.send("ok"); });

const mcsip = "127.0.0.1"
const mcsport = 25565
const serverDir = "/home/john/basmati";
const usercache = JSON.parse(fs.readFileSync(`${serverDir}/usercache.json`, "utf8"));

app.get("/api/players", (req, res) => {
    console.log(`request to '/api/players' from ${req.ip}`)
    mcp.ping({ mcsip, mcsport }, (err, mcres) => {
        if (err) { return res.json({"error": "server down" }); }

        res.json(mcres);
    });
});


// stats
app.get("/stats", (req, res) => {
    res.sendFile(path.join(__dirname, "stats.html"));
});
app.get("/api/stats", (req, res) => {
    console.log(`request to 'api/stats' from ${req.ip}`);

    var retval = [];
    fs.readdirSync(`${serverDir}/world/players/stats/`).forEach((f) => {
        // username lookup
        var uuid = f.replace(".json", "");
        var username = "";

        for (var i = 0; i < usercache.length; i++) {
          if (usercache[i]["uuid"] == uuid) { username = usercache[i]["name"]; }
        }

        // skip over admins/bots
        // also fun fact for future john, over here Zooto is Abdullah, not Deivik he joined with a similar name to Deivik lmao
        if (username == "john" || username == "Zooto7698" || username == "Kitty") return;
    
        var data = JSON.parse(fs.readFileSync(`${serverDir}/world/players/stats/${f}`));

        // now get data
        var deaths = 0;
        deaths = data["stats"]["minecraft:custom"]["minecraft:deaths"];
        if (!deaths) deaths = 0;

        var playtime = data["stats"]["minecraft:custom"]["minecraft:play_time"] / 20 / 60 / 60;
        playtime = Math.round(playtime * 10) / 10;

        var distance = data["stats"]["minecraft:custom"]["minecraft:walk_one_cm"] / 100;
        distance = Math.round(distance);

        var crouchedDistance = data["stats"]["minecraft:custom"]["minecraft:crouch_one_cm"] / 100;
        crouchedDistance = Math.round(crouchedDistance);

        var damageBlockedByShield = data["stats"]["minecraft:custom"]["minecraft:damage_blocked_by_shield"];

        var totalMined = 0;
        var mined = Object.values(data["stats"]["minecraft:mined"]);
        for (var i = 0; i < mined.length; i++) totalMined += mined[i];

        var totalKilled = 0;
        var killed = Object.values(data["stats"]["minecraft:killed"]);
        for (var i = 0 ; i < killed.length; i++) totalKilled += killed[i];

        var damageDealt = data["stats"]["minecraft:custom"]["minecraft:damage_dealt"];
        var damageTaken = data["stats"]["minecraft:custom"]["minecraft:damage_taken"];

        var jumps = data["stats"]["minecraft:custom"]["minecraft:jump"];

        var sleeps = 0;
        sleeps = data["stats"]["minecraft:custom"]["minecraft:sleep_in_bed"]
        if (!sleeps) sleeps = 0;

        var totalPickedUp = 0;
        var picked = Object.values(data["stats"]["minecraft:picked_up"]);
        for (var i = 0; i < picked.length; i++) totalPickedUp += picked[i];

        // console.log(`${username}'s deaths: ${deaths}; playtime: ${playtime}; ${distance}; crouched: ${crouchedDistance}`);
  
        retval.push({
            "username": username,
            "deaths": deaths,
            "playtime": `${playtime} hours`,
            "distance walked": `${Number(distance).toLocaleString()} blocks`,
            "distanced walked while crouched": `${Number(crouchedDistance).toLocaleString()} blocks`,
            "mobs killed": Number(totalKilled).toLocaleString(),
            "damage blocked by shield": Number(damageBlockedByShield).toLocaleString(),
            "blocked mined": Number(totalMined).toLocaleString(),
            "damage dealt": Number(damageDealt).toLocaleString(),
            "damage taken": Number(damageTaken).toLocaleString(),
            "jumps jumped": Number(jumps).toLocaleString(),
            "sleeps": Number(sleeps).toLocaleString(),
            "items picked up": Number(totalPickedUp).toLocaleString(),
        }); 
    });    

    res.json(retval);
});

// full stats
app.get("/fullstats/:username", (req, res) => {
    console.log(`request to 'fullstats/${req.params.username}' from ${req.ip}`);
    res.sendFile(path.join(__dirname, "fullstats.html"));
});
app.get("/api/fullstats/:username", (req, res) => {
    console.log(`request to 'api/fullstats/${req.params.username}' from ${req.ip}`);

    var username = String(req.params.username).toLocaleLowerCase();
    var uuid;

    for (var i = 0; i < usercache.length; i++) {
        if (usercache[i]["name"].toLocaleLowerCase() == username)
            uuid = usercache[i]["uuid"];
    }

    if (!uuid) res.status(404).send("no player");

    var fpath = `${serverDir}/world/players/stats/${uuid}.json`; 
    var data = JSON.parse(fs.readFileSync(fpath, "utf8"));
    res.json(data); 
});

app.listen(port, "0.0.0.0", () => {
    console.log("server up");
});

