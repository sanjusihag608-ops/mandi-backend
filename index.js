const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const admin = require("firebase-admin");

const app = express();

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fetchData() {
  const url = "https://kisanekta.in/nohar-mandi-bhav-today/";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let list = [];

  $("table tr").each((i, el) => {
    if (i === 0) return;

    const tds = $(el).find("td");

    const name = $(tds[0]).text().trim();
    const max = $(tds[1]).text().trim();
    const avg = $(tds[2]).text().trim();
    const min = $(tds[3]).text().trim();

    if (name) {
      list.push({
        name,
        max_price: Number(max),
        avg_price: Number(avg),
        min_price: Number(min),
        date: new Date().toLocaleDateString(),
      });
    }
  });

  return list;
}

app.get("/update-mandi", async (req, res) => {
  try {
    const data = await fetchData();

    for (let item of data) {
      await db.collection("mandi_prices").add(item);
    }

    res.send("Data Updated Successfully ✅");
  } catch (err) {
    console.log(err);
    res.send("Error ❌");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));