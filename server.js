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

app.get("/ok", (req, res) => { res.send("ok"); });

const mcsip = "127.0.0.1"
const mcsport = 25565

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

    const serverDir = "/home/john/basmati";
    const usercache = JSON.parse(fs.readFileSync(`${serverDir}/usercache.json`, "utf8"));

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

        var playtime = 0;
        playtime = data["stats"]["minecraft:custom"]["minecraft:play_time"] / 20 / 60 / 60;
        playtime = Math.round(playtime * 10) / 10;

        var distance = 0;
        distance = data["stats"]["minecraft:custom"]["minecraft:walk_one_cm"] / 100;
        distance = Math.round(distance);

        var crouchedDistance = 0;
        crouchedDistance = data["stats"]["minecraft:custom"]["minecraft:crouch_one_cm"] / 100;
        crouchedDistance = Math.round(crouchedDistance);

        // console.log(`${username}'s deaths: ${deaths}; playtime: ${playtime}; ${distance}; crouched: ${crouchedDistance}`);
  
        retval.push({
            "username": username,
            "deaths": deaths,
            "playtime": `${playtime} hours`,
            "distance walked": `${distance} blocks`,
            "distanced walked while crouched": `${crouchedDistance} blocks`
        }); 
    });    

    res.json(retval);
});

app.listen(port, "0.0.0.0", () => {
    console.log("server up");
});

