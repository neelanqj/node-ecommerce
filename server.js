var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var ejsMate = require('ejs-mate');
var secret = require('./config/secret');
var passport = require('./config/passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fileUpload = require('express-fileupload');
var flash = require('express-flash');
var MongoStore = require('connect-mongo/es5')(session);
var passport = require('passport');

var Category = require('./models/category');
var User = require('./models/user');

var cartLength = require('./middleware/middlewares')

mongoose.connect(secret.database, function(err){
	if(err) {
		console.log('error connecting to db');
	} else {
		console.log('connected to the db');
	}
});

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({resave: true,
	saveUninitialized: true,
	secret: secret.secretKey,
	store: new MongoStore({ url: secret.database, autoReconnect: true })}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session())
app.use(function(req,res,next){
	res.locals.user = req.user;
	next();
});

app.use(function(req,res,next){
	Category.find({}, function(err, categories){
		if(err) return next(err);
		res.locals.categories = categories;
		next();
	});
});
app.use(cartLength);
app.use(fileUpload());

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');

/*
app.post('User', function(){
		var user = new User();

		user.profile.firstName = 'Neelan';
		user.profile.lastName = 'Joachim';
		user.profile.birthDate='1984-01-01';
		user.profile.employeeNumber='123333333';
}) */

var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var apiRoutes = require('./api/api');
app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use('/api', apiRoutes);

app.listen(secret.port, function(err){
	if (err) throw err;
	console.log("Server is Running");
});
