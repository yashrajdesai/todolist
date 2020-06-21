//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://yashrajdesai:kalavati@cluster0-abljl.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemSchema = {
  name: String
}

const Item = mongoose.model("Item", itemSchema);

const ds = new Item({
  name: "Data structures"
})

const web = new Item({
  name: "web devlopment"
})

const code = new Item({
  name: "code"
})

const defaultItems = [ds, web, code];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) { //finds all the documents in db.

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added items!");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      })
    }
  })

});

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {

    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const newItem = new Item({
    name: itemName
  });

  const listName = req.body.list;

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
const checkeditem = req.body.checkbox;
const listName = req.body.listName;


List.findOne({
  name: listName
}, function(err, foundList) {
  if (listName === "Today") {
    Item.findByIdAndRemove(checkeditem, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item deleted successfully!");
        res.redirect("/");
      }

    });
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: checkeditem
          }
        }
      },
      function(err) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    )
  }
});

});




app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
