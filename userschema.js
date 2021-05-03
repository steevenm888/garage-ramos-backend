var mongoose=require('mongoose');

var UserSchema = new mongoose.Schema({
	username: String,
	user_password: String,
	user_type: String
});

module.exports = mongoose.model('user', UserSchema);
