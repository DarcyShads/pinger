import Express from "express";
import fs from "fs";
import fetch from "node-fetch";
import schedule from "node-schedule";

const app = Express();

app.use(Express.static("public"));
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
  for (url of urls) {
    await pingUrl(url);
  }
}

const port = process.env.PORT || 8000;

app.listen(port, function () {
  console.log(`listening on port ${port}`);
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

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, 6];
rule.minute = [0, 20, 40];
const newsJob = schedule.scheduleJob(rule, pingAll);
newsJob.tz = "Asia/Kolkata";
