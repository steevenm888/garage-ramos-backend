var mongoose=require('mongoose');

var LogSchema = new mongoose.Schema({
	log_id: Number,
	user_id: Number,
	action: String,
	date: Date
});

module.exports = mongoose.model('log', LogSchema, 'Logs');
