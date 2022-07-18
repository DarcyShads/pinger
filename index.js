import Express from "express";
import fs from "fs";
import fetch from "node-fetch";
import schedule from "node-schedule";
import path from "path";
import "dotenv/config";

const __dirname = path.resolve();

const app = Express();

var auth = "false";

app.use(Express.json());

async function addUrlToFile(url) {
  const x = fs
    .readFileSync("toPing")
    .toString()
    .trim()
    .split("\n")
    .map((x) => x.trim());
  if (x.lastIndexOf(url) != -1) {
    return "already exists";
  }

  const feedback = await pingUrl(url);
  if (feedback == "success")
    fs.appendFile("toPing", url + "\n", function (err) {
      if (err) {
        console.log(err);
        return "error while insertion";
      }
    });
  return feedback;
}

async function pingUrl(url) {
  try {
    await fetch(url);
  } catch {
    return "error";
  }
  return "success";
}

async function pingAll() {
  const urls = fs
    .readFileSync("toPing")
    .toString()
    .trim()
    .split("\n")
    .map((x) => x.trim());
  console.log(`Ping Starts ${new Date(Date.now())}`);
  for (const u of urls) {
    if (u.trim != "") {
      const status = await pingUrl(u);
      console.log(`${u} : ${status}`);
    }
  }
  console.log("----------------------------------------------------");
}

const port = process.env.PORT || 8000;

app.listen(port, function () {
  console.log(`listening on port ${port}`);
});

app.get("/", function (req, res) {
  auth = "false";
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/addFnP", async function (req, res) {
  const url = req.body.url;
  const status = await addUrlToFile(url);
  res.send(status);
});

app.post("/ping", async function (req, res) {
  const url = req.body.url;
  const status = await pingUrl(url);
  res.send(status);
});

app.post("/authenticate", async function (req, res) {
  const password = req.body.password;
  if (password == process.env.PASSWORD) {
    auth = "true";
  }
  res.send(auth);
});

app.get("/logout", function (req, res) {
  try {
    auth = "false";
    res.send("success");
  } catch (e) {
    res.send("error");
  }
});

app.get("/authenticate", async function (req, res) {
  res.send(auth);
});

app.post("/delurl", async function (req, res) {
  try {
    const url = req.body.url;
    const list = fs
      .readFileSync("toPing")
      .toString()
      .trim()
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x != url);
    fs.writeFileSync("toPing", list.join("\n") + "\n");

    res.send("success");
  } catch (e) {
    res.send("error");
  }
});

app.get("/getURLS", (req, res) => {
  res.json({
    files: fs
      .readFileSync("toPing")
      .toString()
      .trim()
      .split("\n")
      .map((x) => x.trim()),
  });
});

app.get("/view", (req, res) => {
  res.sendFile(__dirname + "/public/view.html");
});

const rule = new schedule.RecurrenceRule();
rule.minute = [0, 20, 40];
const newsJob = schedule.scheduleJob(rule, pingAll);
newsJob.tz = "Asia/Kolkata";
