var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var request = require("request");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 3000;
mongoose.Promise = Promise;

var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://heroku_j5jgln1r:kadq0g2imkt7rfqf61t58aeruv@ds163681.mlab.com:63681/heroku_j5jgln1r");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/scrape", function(req, res) {
  request("https://news.google.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    $("h2.esc-lead-article-title").each(function(i, element) {
      var result = {};
      result.title = $(this).children("a").children("span").text();
      result.link = $(this).children("a").attr("href");
      var entry = new Article(result);
      entry.save(function(err, doc) {
        {unique: true}
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
  });
  res.redirect("/");
});

app.get("/articles", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

app.get("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);

  newNote.save(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
    }
  });
});
//delete is not working
app.delete("/delete/:id", function (req, res) {
  var id = req.params.id.toString();
  Note.remove({
    "_id": id
  }).exec(function (error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      console.log("note deleted");
      res.redirect("/" );
    }
  });
});

app.listen(PORT, function() {
  console.log("App running on port 8080!");
});
