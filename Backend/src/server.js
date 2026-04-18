require("dotenv").config();

const app = require("./app");
const conectarDB = require("./config/db");

conectarDB();

app.listen(process.env.PORT, () => {
  console.log("Servidor corriendo");
});