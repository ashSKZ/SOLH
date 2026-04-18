const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/dashboardRoutes"));
app.use("/api/prediccion", require("./routes/prediccionRoutes"));
app.use("/api/capital", require("./routes/capitalRoutes"));

module.exports = app;