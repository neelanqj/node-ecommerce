var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Category = require('./category');

var Schema = mongoose.Schema;

var ProductSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  name: { type: String, unique: true },
  price: Number,
  image: String,
  description: {type: String, default: "" },
  visible: {type: Boolean, default: true }
});

ProductSchema.plugin(mongoosastic,{
  hosts: [
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Product', ProductSchema);
