const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const admin = require("firebase-admin");

const app = express();

// 🔐 Firebase key (Render ENV)
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 📥 Data fetch function
async function fetchData() {
  const url = "https://kisanekta.in/nohar-mandi-bhav-today/";

  const { data } = await axios.get(url, {
    timeout: 20000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

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
        max_price: parseInt(max) || 0,
        avg_price: parseInt(avg) || 0,
        min_price: parseInt(min) || 0,
        date: new Date().toLocaleDateString(),
      });
    }
  });

  return list;
}

// 🚀 API route
app.get("/update-mandi", async (req, res) => {
  try {
    const data = await fetchData();

    for (let item of data) {

      // 🔥 CLEAN UNIQUE ID (duplicate fix)
      const docId = item.name
        .trim()
        .replace(/\s+/g, "_")
        .toLowerCase();

      await db.collection("mandi_prices")
        .doc(docId)
        .set(item, { merge: true });
    }

    res.send("Data Updated Successfully ✅");

  } catch (err) {
    console.log(err);
    res.send("Error ❌");
  }
});

// 🟢 Server start
app.listen(3000, () => {
  console.log("Server running on port 3000");
});