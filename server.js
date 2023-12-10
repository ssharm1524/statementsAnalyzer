const MonthlyAnalysis = require('./MonthlyAnalysis');
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
app.use(bodyParser.json());
app.use(express.static('templates'));
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
      return res.status(400).send('Error converting CSVs through Cloudmersive API.');
    } else {
      console.log('API called successfully.');
      req.json = data;
      next();
    }
  };
  apiInstance.convertDataCsvToJson(inputFile, opts, callback);
}

const getUserData = async (req, res, next) => {
   if (!req.body.email && !req.query.email) {
    res.status(500).send('No Email Given');
   }
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
      await client.connect();
      let filter = {
        email : req.body.email ?? req.query.email,
      }
      const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
      req.monthlyAnalysisData = null;
      if (result) {
          req.monthlyAnalysisData = result.monthlyAnalysisData;
      }
  } catch (e) {
      console.error(e);
      return res.status(500).send('Internal Server Error');
  } finally {
      await client.close();
  }
  next();
}

const parseJson = (req,res,next) => {
  data = req.json;
  prevUserData = req.monthlyAnalysisData;

  let analysisArray;
  if (prevUserData != null) {
    analysisArray = prevUserData.map(json => MonthlyAnalysis.fromJSON(json));
  } else {
    console.log("case 2");
    analysisArray = new Array(12);
    for (let i = 0; i < analysisArray.length; i++) {
      analysisArray[i] = new MonthlyAnalysis(i);
    }
  }
  
  data.forEach((transaction) => {
    let monthIndex = Number(transaction["Posted Date"].substring(0,2))-1;
    let merchant = transaction["Payee"];
    //JSON data comes in as "-64.99" for purchases. Want to turn this into 64.99 and vice versa for deposits.
    let amount = Number(transaction.Amount) * -1; 
    let analysisObj = analysisArray[monthIndex];

    analysisObj.updateTotalSpending(amount);
    analysisObj.addMerchantSpending(merchant,amount);
  });

  req.monthlyAnalysisData = analysisArray.map(analysis => analysis.toJSON());
  next();
}

const storeJson = async (req, res, next) => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    const filter = { email: req.body.email };
    const userData = {
      email: req.body.email,
      monthlyAnalysisData: req.monthlyAnalysisData,
    };
    const options = { upsert: true }; // Set upsert option to true to insert if not found, update otherwise
    const result = await client.db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .updateOne(filter, { $set: userData }, options);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error updating database');
  } finally {
    await client.close();
  }
  next();
};

const parseMonthlyInsights = (req, res, next) => {
  if (req.query.month == null) {
    res.status(500).send('No month recieved with month choice.');
  }

  if (req.monthlyAnalysisData == null) {
    res.status(500).send('No userData receieved.');
  }

  let analysisArray = req.monthlyAnalysisData.map(json => MonthlyAnalysis.fromJSON(json));
  let analysisObj = analysisArray[MonthlyAnalysis.getMonthIndexByString(req.query.month)];

  let merchantBySpending = analysisObj.getMerchantByHighestSpent();
  let spendingAmount = analysisObj.getMerchantSpending(merchantBySpending);
  let merchantByFreq = analysisObj.getMerchantByHighestFreq();
  let freqAmount = analysisObj.getMerchantSpending(merchantByFreq);

  req.userInsights = {
    month : req.query.month,
    totalAmount : analysisObj.totalSpending,
    merchantBySpending : merchantBySpending,
    spendingAmount : spendingAmount,
    merchantByFreq : merchantByFreq,
    freqAmount : freqAmount
  }

  next();
}

const parseYearlyInsights = (req, res, next) => {
  if (req.monthlyAnalysisData == null) {
    res.status(500).send('No userData receieved.');
  }

  let analysisArray = req.monthlyAnalysisData.map(json => MonthlyAnalysis.fromJSON(json));


  let yearObj = analysisArray.reduce((acculmulator, currAnalysisObj) => {
    acculmulator.totalSpending += currAnalysisObj.totalSpending;
    MonthlyAnalysis.combineMerchantMaps(acculmulator.yearMap, currAnalysisObj.merchantMap);
    return acculmulator;
  }, {
    totalSpending : 0,
    yearMap : new Map(),
  });

  let maxAmount = 0;
  let maxCount = 0;
  let maxMerchantBySpending = null;
  let maxMerchantByFreq = null;

  yearObj.yearMap.forEach((data, merchant) => {
    if (data.totalAmount > maxAmount) {
      maxAmount = data.totalAmount;
      maxMerchantBySpending = merchant;
    }
    if (data.count > maxCount) {
      maxCount = data.count;
      maxMerchantByFreq = merchant;
    }
  });

  let spendingAmount = yearObj.yearMap.get(maxMerchantBySpending);
  let freqAmount = yearObj.yearMap.get(maxMerchantByFreq);

  req.userInsights = {
    totalAmount : yearObj.totalSpending,
    merchantBySpending : maxMerchantBySpending,
    merchantByFreq : maxMerchantByFreq,
    spendingAmount : spendingAmount,
    freqAmount : freqAmount
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

app.post('/inputForm', csvToJson, getUserData, parseJson, storeJson, (req,res) => {
  res.render('confirmation', { email: req.body.email });
})

app.get('/insightSelection', (req,res) => {
  res.render('insightSelection')
});

app.post('/insightSelection', (req,res) => {
  if (!req.body.choice || !req.body.email) {
    res.status(500).send(`Internal Server Error. No email Given.`);
  }

  if (req.body.choice === 'month') {
    res.redirect(`/monthlyInsights?email=${req.body.email}&month=${req.body.month}`);
  } else if (req.body.choice === 'year') {
    res.redirect(`/yearlyInsights?email=${req.body.email}`);
  } else {
    res.status(500).send('Internal Server Error. Did not recieve correct choice.');
  }
});

app.get('/monthlyInsights', getUserData, parseMonthlyInsights, (req,res) => {
  res.render('monthlyInsights', req.userInsights);
});

app.get('/yearlyInsights', getUserData, parseYearlyInsights, (req,res) => {
  res.render('yearlyInsights', req.userInsights);
});

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