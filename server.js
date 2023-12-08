const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

//set up mongodb
require("dotenv").config();  
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.kunuld8.mongodb.net/?retryWrites=true&w=majority`;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');

//set up express
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());
app.listen(3000);
console.log(`Web server started and running at http://localhost:3000`);

//define middleware
const csvToJson =  (req,res,next) => {
  var CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
  var defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;

  // Configure API key authorization: Apikey
  var Apikey = defaultClient.authentications['Apikey'];
  Apikey.apiKey = process.env.API_KEY;

  var apiInstance = new CloudmersiveConvertApiClient.ConvertDataApi();

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  const inputFile = req.files.statement.data; // Access the file buffer

  var opts = { 
    'columnNamesFromFirstRow': true // Boolean | Optional; If true, the first row will be used as the labels for the columns; if false, columns will be named Column0, Column1, etc.  Default is true.  Set to false if you are not using column headings, or have an irregular column structure.
  };

  var callback = function(error, data, response) {
    if (error) {
      console.error(error);
    } else {
      console.log('API called successfully. Returned data: ' + data);
      req.json = data;
      next();
    }
  };
  apiInstance.convertDataCsvToJson(inputFile, opts, callback);
}

const parseJson = (req,res,next) => {
  data = req.json;

  class Transaction {
    #date;
    #id;
    #merchant;
    #location;
    #amount;
    static max;
  
    constructor(date, id, merchant, location, amount) {
      this.#date = date;
      this.#id = id;
      this.#merchant = merchant;
      this.#location = location;
      this.#amount = amount;
      Transaction.max
    }
  
    // Getter and setter for 'date'
    get date() {
      return this.#date;
    }
  
    set date(newDate) {
      this.#date = newDate;
    }
  
    // Getter and setter for 'id'
    get id() {
      return this.#id;
    }
  
    set id(newId) {
      this.#id = newId;
    }
  
    // Getter and setter for 'merchant'
    get merchant() {
      return this.#merchant;
    }
  
    set merchant(newMerchant) {
      this.#merchant = newMerchant;
    }
  
    // Getter and setter for 'location'
    get location() {
      return this.#location;
    }
  
    set location(newLocation) {
      this.#location = newLocation;
    }
  
    // Getter and setter for 'amount'
    get amount() {
      return this.#amount;
    }
  
    set amount(newAmount) {
      this.#amount = newAmount;
    }
  }

  //map of store -> amount
  //max heap to store largest transaction
  //bst to store by transaction amount
  data.forEach((transaction) => {
    temp = new Transaction(transaction["Posted Date"], transaction["Reference Number"], transaction.Payee, transaction.Address, transaction.Amount);

  });
}

//define express routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/inputForm', (req, res) => {
  res.render('inputForm');
});

app.post('/inputForm', csvToJson, parseJson, (req,res) => {
  console.log(req.json);
  res.render('jsonView', { jsonData: req.json });
})

//listen for stop
process.stdout.write('Stop to shutdown the server: ');
process.stdin.on("readable", function () {
  const userInput = process.stdin.read();
  if (userInput !== null) {
    const command = userInput.toString().trim(); // Ensure userInput is a string before calling trim
    if (command === "stop") {
      process.stdout.write("Shutting down the server\n");
      process.exit(0);
    }
  }
  process.stdin.resume();
});