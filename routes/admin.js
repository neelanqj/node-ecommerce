var router = require('express').Router();
var Category = require('../models/category');
var Product = require('../models/product');
var User = require('../models/user');
var async = require('async');
var passportConf = require('../config/passport');
var sizeOf = require('image-size');

router.get('/add-category', function(req, res, next) {
  User.findOne({_id: req.user._id}, function(err, user){
    if(user.accesstype == 0) {
      res.redirect('/');
    } else if (user.accesstype == 1){
      if(err) return next(err);
      res.render('admin/add-category', { message : req.flash('success')});
    }
  });
});

router.post('/add-category',  function(req, res, next) {
  var category = new Category();
  category.name = req.body.name;

  category.save(function(err){
    if(err) return next(err);
    req.flash('success','Successfully added category');
    return res.redirect('/add-category');
  });
});

router.get('/add-product', function(req, res, next) {
  User.findOne({_id: req.user._id}, function(err, user){
    if(user.accesstype == 0) {
      res.redirect('/');
    } else if (user.accesstype == 1){
      if(err) return next(err);
      Category.find({}, function(err, category){
          res.render('admin/add-product', {
            success : req.flash('success'),
            failure : req.flash('failure'),
            category : category
          });
      });
    }
  });
});

router.post('/add-product', function(req, res, next) {
  var uploadFile, fileName;
  var product = new Product();
  var timestamp = new Date();

  User.findOne({_id: req.user._id}, function(err, user){
        product.name = req.body.name;
        product.price = req.body.price;
        product.description = req.body.description;
        Category.findOne({ name : req.body.category }, function(err, category) {
            if (err) return next(err);
            product.category = category._id;

            if (!req.files) {
                res.send('No files were uploaded.');
                return;
              }

            uploadFile = req.files.uploadFile;
            fileName = '/upload/'+category.name+'_'+req.body.name+'_'+user._id+'.jpg'
            product.image = fileName;

            uploadFile.mv('./public'+fileName, function(err) {
              if (err) {
                  res.status(500).send(err);
              } else {
                  sizeOf('./public'+fileName, function (err, dimensions) {
                    if (dimensions.width == 669 && dimensions.height == 579) {
                        product.save(function(err){
                          req.flash('success','Successfully added ' +product.name+ ' to the products.');
                          res.redirect('/add-product');
                        });
                    } else {
                      req.flash('failure','Improper dimensions could not added ' +product.name+ ' to the products. Make sure the image width is 669px and height is 579px.');
                      res.redirect('/add-product');
                    }
                  });
              }
          });
        });
      });
});

router.get('/sales-list', function(req, res, next) {
  User.findOne({_id: req.user._id}, function(err, user){
    if(user.accesstype == 0) {
      res.redirect('/');
    } else if (user.accesstype == 1){
      if(err) return next(err);
      User.find({})
        .populate('history.item')
        .exec(function(err, client) {
          if(err) return next(err);
          res.render('admin/sales-list', {
            client : client
          });
        });
    }
  });
});

module.exports = router;
