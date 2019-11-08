require("dotenv").config();
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");

mongoose.set('createIndexes', true);


// var Note = require("./models/Note.js");
// var Article = require("./models/Article.js");
var db = require("./models");


var request = require("request");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 8080;
mongoose.Promise = Promise;

var app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set('index', __dirname + '/views');


app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));


// MONGOOSE CONNECTION
var MONGODB_URI = process.env.MONGODB_URI || process.env.DEVDATABASE;

mongoose.connect(MONGODB_URI, { useUnifiedTopology: true,  useNewUrlParser: true});

// var db = mongoose.connection;


// db.on("error", function(error) {
//   console.log("Mongoose Error: ", error);
// });

// db.once("open", function() {
//   console.log("Mongoose connection successful.");
// });

// Start routes here...
app.get("/", function (req, res) {
  db.Article.find({ saved: false }, function (err, result) {
      if (err) throw err;
      res.render("index", { result })
  })
});

// app.get("/scrape", function (req, res) {
//   var elements = [];
//   axios.get("https://www.gameinformer.com/").then(function (response) {
//       var $ = cheerio.load(response.data)
//       $(".article-container").each(function (i, element) {
//         elements.push($(element).find("h3"));
          // var headline = $(element).text();
          // var link = "https://www.nytimes.com";
          // link = link + $(element).parents("a").attr("href");
          // var summaryOne = $(element).parent().parent().siblings().children("li:first-child").text();
          // var summaryTwo = $(element).parent().parent().siblings().children("li:last-child").text();

          // if (headline && summaryOne && link) {
          //     results.push({
          //         headline: headline,
          //         summaryOne: summaryOne,
          //         summaryTwo: summaryTwo,
          //         link: link
          //     })
          // }
      // });
      // res.json(elements);
      // console.log("Ahoy matey!", elements);
      // db.Article.create(results)
      //     .then(function (dbArticle) {
      //         res.render("index", { dbArticle });
      //         console.log(dbArticle);
      //     })
      //     .catch(function (err) {
      //         console.log(err);
      //     })
      // app.get("/", function (req, res) {
      //     res.render("index")
      // })
//   })
//   .catch(function(err) {
//     res.json(err);
//   });
  
// });

app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.gameinformer.com/").then(function(response) {
    let results = []
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.article-body .teaser-right").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      const $ele = $(element).find(".article-title a:last-child")
      
      result.title = $ele.text()
      result.link = "https://www.gameinformer.com" + $ele.attr("href");

      results.push(result)

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.json(results);
  });
});

app.put("/update/:id", function (req, res) {
  console.log("!!!!!!!!!!!!--UPDATE--!!!!!!!!!!!!!!")
  db.Article.updateOne({ _id: req.params.id }, { $set: { saved: true } }, function (err, result) {
      if (result.changedRows == 0) {
          return res.status(404).end();
      } else {
          res.status(200).end();
      }
  });
});
app.put("/unsave/:id", function(req, res) {
  console.log("XXXXXXXXXXXXX--UNSAVE--XXXXXXXXXXXXXXXXXX")
  console.log(req.body)
  db.Article.updateOne({ _id: req.params.id }, { $set: { saved: false }}, function(err, result) {
      if (result.changedRows == 0) {
          return res.status(404).end();
      } else {
          res.status(200).end();
      }
  })
})

app.put("/newnote/:id", function(req, res) {
  console.log("****************NEW NOTE********************")
  console.log(req.body)
  console.log(req.body._id);
  console.log(req.body.note);
  db.Article.updateOne({ _id: req.body._id }, { $push: { note: req.body.note }}, function(err, result) {
      console.log(result)
      if (result.changedRows == 0) {
          return res.status(404).end();
      } else {
          res.status(200).end();
      } 
  })
})



app.get("/saved", function (req, res) {
  // var savedArticles = [];
  db.Article.find({ }, function (err, saved) {
      if (err) throw err;
      // savedArticles.push(saved)
      res.render("saved", { saved })
  });
});



app.listen(PORT, function() {
  console.log("App running on port 8080!");
});
