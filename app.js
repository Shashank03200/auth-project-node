//eshine jsversion:6
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const ejs = require('ejs');
const bcrypt = require('bcrypt')
app = express();

// Middlewares
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')

// Express session middleware
app.use(session({
  secret: 'secrets',
  resave: true,
  saveUninitialized: true,
}));

// Connect flash middleware
app.use(flash());

// Global vars
app.use((req, res, next)=>{
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.danger_msg = req.flash('danger-msg');
  next();
})


// Setting up database
mongoose.connect("mongodb://localhost:27017/usersDB", { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to the database.')
});

// creating the schema and the model

const userInfo = new mongoose.Schema({
  name: {
    required: true,
    type: String
  },
  username: {
    required: true,
    type: String
  },
  password: {
    required: true,
    type: String
  }
})

const user = mongoose.model('user', userInfo);

app.get("/", function (req, res) {
  res.render('home');
})


// Login
app.get("/login", function (req, res) {
  res.render('login');
})


app.post("/login", function (req, res) {
  const { username, password } = req.body;

  const errors = [];
  if (!username || !password) {
    errors.push({ message: "Please fill out all the fields." });
  }
  if (errors.length) {
    res.render('login', {
      errors,
      username
    })
  } else {

    user.findOne({ username: username }).then(foundUser => {

      if (foundUser) {

        bcrypt.compare(password, foundUser.password).then(function(foundUser){
          if(foundUser)
            res.redirect("/secret_page");
          else{
            errors.push({ type:'danger', message: "The password is incorrect." })
            res.render('login', { errors, username });
            // res.flash('danger_msg', 'The password entered is incorrect.');
          }
        })

      }
      else {
        errors.push({ type:'info', message: "The username is not registered." })
        res.render('login', {
          errors,
          username
        })
      }
    })

  }

})

// Register
app.get("/register", function (req, res) {
  res.render('register');
})


app.post("/register", function (req, res) {
  const { name, username, password1, password2 } = req.body;
  const errors = [];

  if (!name || !username || !password1 || !password2)
    errors.push({ message: "Please fill out all the fields." });
  if (password1 != password2)
    errors.push({ message: "The passwords do not match." })
  if (password1.length < 6) {
    errors.push({ message: "The password should be at least 6 characters." })
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      username,
      password1,
      password2
    })
  }
  else {
    user.findOne({ username: username }).then(foundUser => {
      if (foundUser) {
            errors.push({ message: 'Email already exists' });
            res.render('register', {
              errors,
              name,
              username,
              password1,
              password2
            });
      } else {
            const newUser = new user({
              name: name,
              username: username,
              password: password1
            });

            bcrypt.genSalt(15, function(err, salt){
              bcrypt.hash(newUser.password, salt, (err, hash)=>{
                  if(err) throw err;
                  // Setting password to hash
                  newUser.password = hash;

                  // Saving user data
                  newUser.save()
                  .then(user=>{
                    req.flash('success_msg','You are now registered and can log in.');
                    res.redirect("/login"); 
                  })
                  .catch((err)=>{
                    console.log(err)
                  })

              })
            })


        
        }
    });
  }

})

// Secret
app.get("/secret_page", function (req, res) {
  res.render("secret_page");
})

app.listen(3000, function () {
  console.log('Server started on port 3000');
})


















