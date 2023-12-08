const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require('body-parser');

//set up mongodb
require("dotenv").config();  
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.kunuld8.mongodb.net/?retryWrites=true&w=majority`;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');

//set up express
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(3000);
console.log(`Web server started and running at http://localhost:3000`);

//define express routes
app.get('/', (req, res) => {
  res.render('index');
});

//listen for stop
process.stdout.write('Stop to shutdown the server: ');
process.stdin.on("readable", function () {
  userInput = process.stdin.read();
  if (userInput !== null) {
      command = userInput.trim();
      if (command === "stop") {
          process.stdout.write("Shutting down the server\n");
          process.exit(0);
      }
      process.stdin.resume();
  }
});