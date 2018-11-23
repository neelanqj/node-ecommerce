var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var Schema = mongoose.Schema;

/* The user schema attributes / characteristics / fields */
var UserSchema = new Schema({
  email: { type: String, unique: true, lowercase: true },
  password: String,
  accesstype: { type: Number, default: 0 },
  profile: {
    name: { type: String, default:'' },
    picture: { type: String, default:'' }
  },
  address: {type: String, default: ""},
  history: [{
    paymenttype: String,
    paid: { type: Number, default: 0},
    item: { type: Schema.Types.ObjectId, ref: 'Product'},
    date: { type: Date, default: new Date()},
    creditcardname: String,
    creditcardnumber: String,
    creditcardcvc: Number,
    charge: String
  }],
  createdate: { type: Date, default: new Date()}
});

UserSchema.pre('save',function(next){
  var user = this;
  if(!user.isModified('password')) return next();
  bcrypt.genSalt(10,function(err, salt){
    if (err) return next(err);
    bcrypt.hash(user.password, salt, null,function(err, hash){
      user.password=hash;
      next();
    })
  });
});

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
}

UserSchema.methods.gravatar = function(size) {
  if(!this.size) size = 200;
  if(!this.email) return 'https://gravatar.com/avatar/?s'+size+'&d=retro';

  var md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return 'https://gravatar.com/avatar/'+md5+'?s='+size+'&d=retro'
}

module.exports = mongoose.model('User', UserSchema);
