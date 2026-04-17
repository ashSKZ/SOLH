const express = require("express");
const ingestaRoutes = require("./routes/ingestaRoutes");

const app = express();

app.use(express.json());
app.use("/api/ingesta", ingestaRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, mensaje: "Backend SOLH activo" });
});

module.exports = app;
