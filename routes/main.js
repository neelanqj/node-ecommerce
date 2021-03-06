var router = require('express').Router();
var User = require('../models/user');
var Product = require('../models/product');
var Cart = require('../models/cart');
var async = require('async');
var stripe = require('stripe')('sk_test_NYDObFZcZG2bYmuFATvtqfKb');

function paginate(req,res,next){
	var perPage = 9;
	var page = req.params.page;

	Product.find().skip( perPage * page)
	.limit(perPage).populate('category')
	.exec(function(err, products){
		Product.count().exec(function(err,count){
			if(err) return next(err);
			res.render('main/product-main',{
				products: products,
				pages: count/perPage
			});
		});
	});
}

Product.createMapping(function(err,mapping){
	if(err) {
		console.log("error creating mapping");
		console.log(err);
	} else {
		console.log("Mapping created");
		console.log(mapping);
	}
});

var stream = Product.synchronize();
var count=0;

stream.on('data',function(){
	count++;
});

stream.on('close',function(){
	console.log("Indexed "+count+" documents");
});

stream.on('error',function(err){
	console.log(err);
});

router.get('/cart', function(req,res,next){
	Cart
		.findOne({ owner : req.user._id })
		.populate('items.item')
		.exec(function(err, foundCart){
			if(err) return next(err);
			res.render('main/cart',{
				foundCart : foundCart,
				message : req.flash('removed')
			});
	});
});

router.post('/product/:product_id', function(req,res,next){
	Cart.findOne({ owner: req.user._id }, function(err, cart){
		cart.items.push({
			item: req.body.product_id,
			price: parseFloat(req.body.priceValue),
			quantity: parseInt(req.body.quantity)
		});

		cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);

		cart.save(function(err){
			if(err) return next(err);
			return res.redirect('/cart');
		});
	});
});

router.post('/remove-cartitem', function(req,res,next){
		Cart.findOne({ owner: req.user._id }, function(err, foundCart){
			foundCart.items.pull(String(req.body.item));
			foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
			foundCart.save(function(err){
				if(err) return next(err);
				req.flash('removed', 'Successfully removed the cart item.');
				res.redirect('/cart');
			});
	});
});

router.post('/search', function(req,res,next){
	res.redirect('/search?q='+req.body.q);
});

router.get('/search',function(req,res,next){
	if(req.query.q){
			Product.search({
					query_string: {query: req.query.q}
		  	}, function(err,results){
					if(err) return next(err);
					var data = results.hits.hits.map(function(hit){
						return hit;
					});
				res.render('main/search-result', {
					query: req.query.q,
					data: data
				});
			});
		}
});

router.get('/', function(req,res,next){
	if(req.user){
		paginate(req, res, next);
	} else {
		res.render('main/home');
	}
});

router.get('/page/:page', function(req,res,next){
	paginate(req,res,next);
});

router.get('/users',function(req,res){
	User.find({},function(err,users){
		res.json(users);
	});
});

router.get('/products/:id', function(req,res,next){
	Product.find({ category: req.params.id }).populate('category').exec(function(err,products){
			if(err) return next(err);
			res.render('main/category',{
				products: products
			});
	});
});

router.get('/product/:id', function(req,res,next){
	Product.findById({ _id : req.params.id },function(err,product){
			if(err) return next(err);
			res.render('main/product',{
				product: product
			});
	});
});

router.post('/payment', function(req,res,next){
	var stripeToken = req.body.stripeToken;
	var currencyCharges = Math.round(req.body.stripeMoney * 100);

	stripe.customers.create({
		source: stripeToken
	}).then(function(customer){
		return stripe.charges.create({
		  customer: customer.id,
			amount: currencyCharges,
			currency: 'USD',
			metadata: {
				'creditcardname': req.body.name,
				'email': req.user.email,
				'username': req.user.profile.name
			}
		});
	}).then(function(charge){
		// console.log(res.json(charge));
		async.waterfall([
			function(callback){
				Cart.findOne({owner: req.user._id }, function(err, cart){
					callback(err,cart);
				});
			},
			function(cart, callback){
				User.findOne({ _id: req.user._id }, function(err, user){
					if(user){
						for(var i = 0; i < cart.items.length; i++) {
							user.history.push({
								paymenttype: "payment",
								item: cart.items[i].item,
								paid: cart.items[i].price,
								creditcardname: req.body.name,
								creditcardnumber: (req.body.cardnumber).substr(req.body.cardnumber.length - 4),
								creditcardcvc: req.body.cardcvc,
								charge: charge.id
							});
						}
						user.save(function(err,user){
							if(err) return next(err);
							callback(err,user);
						});
					}
				});
			},
			function(user, callback){
				Cart.update({owner: user._id}, { $set: {items: [], total: 0}}, function(err, updated){
					if(updated){
						res.redirect('/profile');
					}
				});
			}
		]);
	});
});

router.post('/refund', function(req,res,next){

	stripe.refunds.create({
		charge: req.body.charge,
		amount: parseInt(parseFloat(req.body.paid) * 100)
	}, function(err, refund) {
		if(err) return next(err);
		// asynchronously called
		User.findOne({ '_id': req.body.user_id }, function(err, user){
			if(user){
				user.history.push({
					paymenttype: "refund",
					item: req.body.item_id,
					paid: req.body.paid,
					creditcardname: req.body.creditcardname,
					creditcardnumber: req.body.creditcardnumber,
					creditcardcvc: req.body.creditcardcvc,
					charge: req.body.charge
				});

				let history = user.history.id(req.body.history_id);

				//console.log(res.json(history));
				history.paymenttype ="paymentr";
				user.save(function(err,history){
					if(err) return next(err);
					req.flash('message','Refund issued successfully for ' +req.body.paid);
					res.redirect('profile');
				});
			}
		});
	});
});
module.exports = router;
