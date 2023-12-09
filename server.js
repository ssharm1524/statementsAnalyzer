import MonthlyAnalysis from './MonthlyAnalysis';

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

//create array where each index is a month and holds a MonthlyAnalusis Object
const analysisArray = new Array(12);
for (let i = 0; i < analysisArray.length; i++) {
  analysisArray[i] = new MonthlyAnalysis(i);
}

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

  data.forEach((transaction) => {
    let month = transaction["Posted Date"].substring(0,2);
    let merchant = transaction["Payee"];
    //JSON data comes in as "-64.99" for purchases. Want to turn this into 64.99 and vice versa for deposits.
    let amount = Number(transaction.Amount) * -1; 
    let analysisObj = analysisArray[MonthlyAnalysis.getMonthIndexByString(transaction)];

    analysisObj.updateTotalSpending(amount);
    analysisObj.addMerchantSpending(merchant,amount);
  });

  next();
}

const storeJson = async (req,res,next) => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
      await client.connect();
      let statement = {
        name : req.body.name,
        email : req.body.email,
        gpa : req.body.gpa,
        backgroundInfo : req.body.backgroundInfo,
        time : new Date().toString(),
      }
      req.application = application;
      const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(application);
  } catch (e) {
      console.error(e);
      res.send('Error updataing database');
  } finally {
      await client.close();
  }
  next();
}

//define express routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/inputForm', (req, res) => {
  res.render('inputForm');
});

app.post('/inputForm', csvToJson, parseJson, storeJson, (req,res) => {
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