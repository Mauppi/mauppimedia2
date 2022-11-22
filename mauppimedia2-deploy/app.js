const express = require("express");
const app = express();

app.post("/deploy", (req, res) => {
  if (req.get("X-Hub-Signature-256") != "perunamuussi") {
    console.log("Deploy fail.");
    return res.sendState(403);
  }
  
  console.log("Deploy received.\nStopping parent server...");
  exec("../npm stop", (err, stdout, stderr) => {
    if(err) {
      console.log(err);
      return;
    }
    console.log("Server has been stopped.\nPulling from git.");
    exec("../git pull", (err, stdout, stderr) => {
    if(err) {
      console.log(err);
      return;
    }
    
    console.log("Git pull complete. Starting parent server...");
    exec("../npm start", (err, stdout, stderr) => {
    if(err) {
      console.log(err);
      return;
    }
    console.log("Done.");
    });
    });
  });
});

app.listen(7777, () => {
  console.log("Deploy server listening on port 7777");
});