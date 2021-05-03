var http = require('http');
const https = require('https');
var express = require('express');
var mqtt = require('mqtt');
const jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var UserModel = require('./userschema');
var LogModel = require('./logschema');
var bodyParser = require('body-parser');
const fs = require('fs');

//var query = 'mongodb://localhost/garage-app'
var query = 'mongodb+srv://esteban:EstemolinA19980104@cluster0.h5qtq.mongodb.net/garage-app?retryWrites=true&w=majority'
const db = (query);
//mongoose.Promise = global.Promise;
// console.log(require('crypto').randomBytes(64).toString('hex'));
const secretKey = '944c5ed940b950950c57b636efb2ba07e81c0c2fba656459b54ca481b1327f8cc9d757011f0a8eb857a59539b3109d2b81a62f298de1f8712a775f61c214e93e';

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
	if (err) {
		console.log(err)
	}
});

var app = express();
app.use(express['static'](__dirname));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const secret = { secret: process.env.SECRET || 'example' }

var client = mqtt.connect('mqtts://mqtt.flespi.io', {
	username: 'Cb8rMoalSp2WPK2megckYSmxkzBaHcK7bGoOUnXCAPmfnfrqlry77LviaWgGWQDW',
	password: ''
});

client.on('connect', function () {
	console.log('MQTT client connected')
});

function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]
	if (token == null){
		return res.sendStatus(401)
	}
	jwt.verify(token, secretKey, (err, user) => {
		if (err) {
			console.log(err)
			return res.sendStatus(403)
		}  else {
			req.user = user
			next()
		}
	})
}

app.get('/open/garage', authenticateToken, function (req, res) {
	client.publish('steevenm888/garage-door', '{"activateGarage": true}');
	res.status(200).send({ action: 'triggered' });
});

app.get('/api/user', authenticateToken, function (req, res) {
	if(req.user.user.user_type == 'ADMIN') {
		UserModel.find(function (err, users) {
			if(err) {
				res.status(500).send(err);
			} else {
				res.status(200).send(users);
			}
		});
	} else {
		res.status(403).send("Usuario no está autorizado a realizar esta acción.");
	}
});

app.post('/api/user', authenticateToken, function (req, res) {
	if (req.user.user.user_type == 'ADMIN') {
		
		var username = req.body.username;
		UserModel.find({"username": username}, function (err, user) {
			if(err) {
				res.status(500).send("Hubo un error, intente de nuevo más tarde.");
			} else {
				if(user.length > 0) {
					res.status(400).send("El usuario ya existe!");
				} else {
					var user_password = "423D6A0E347F6821D9703A269436F8E9353BADFDF10376F5EB91BFE6D4133E5E";
					var user_type = req.body.user_type;
					var newUser = new UserModel({ username: username, user_password: user_password, user_type: user_type })
					newUser.save().then(user => {
						res.send(user);
					}, (e) => {
						res.status(400).send("error: " + e);
					});
				}
			}
		})
	} else {
		res.status(403).send("Usuario no está autorizado a realizar esta acción.");
	}
});

app.put('/api/user/password', authenticateToken, function (req, res) {
	var newPassword = req.body.password;
	UserModel.updateOne(
	{
		"username": req.user.user.username
	},
	{
		"user_password": newPassword
	}, function (err, user) {
		if(err) {
			res.status(500).send('No se pudo actualizar la contraseña. Intente más tarde.')
		} else {
			res.status(200).send('La contraseña se cambio con exito.');
		}
	});
});

app.put('/api/user/reset/password/:username', authenticateToken, function (req, res) {
	if(req.user.user.user_type == 'ADMIN') {
		var username = req.params.username;
		UserModel.updateOne(
		{
			"username": username
		},
		{
			"user_password": "423D6A0E347F6821D9703A269436F8E9353BADFDF10376F5EB91BFE6D4133E5E"
		}, function (err, user) {
			if(err) {
				res.status(500).send('No se pudo resetear la contraseña. Intente más tarde.')
			} else {
				res.status(200).send('La contraseña se reseteo con exito.');
			}
		});
	} else {
		res.status(403).send("Usuario no está autorizado a realizar esta acción.");
	}
})

app.delete('/api/user/:username', authenticateToken,  function (req, res) {
	if(req.user.user.user_type == 'ADMIN') {
		UserModel.deleteOne({"username": req.params.username}, function (err, user) {
			if(err) {
				res.status(500).send("Hubo un error al eliminar el usuario, intente de nuevo mas tarde.");
			} else {
				res.status(200).send("Se eliminó el usuario con exito.");
			}
		}); 
	}
});

app.post('/api/login', (req, res) => {
	UserModel.find({
		"username": req.body.username,
		"user_password": req.body.user_password
	}, function (err, user) {
		if (err) {
			console.log("ERROR: " + err);
			res.status(500).send(err);
		} else {
			if (user.length > 0) {
				const authUser = {
					id: user[0]._id,
					username: user[0].username,
					user_type: user[0].user_type
				}
				jwt.sign({ user: authUser }, secretKey, (err, token) => {
					if (err) {
						res.status(500).send(err)
					} else {
						res.json({
							token
						});
					}
				});
			} else {
				res.status(401).send("Usuario o contraseña incorrectos!");
			}
		}
	});
})

app.get('*', function (req, res) {
	res.status(404).send('Unrecognised API call');
});

app.use(function (err, req, res, next) {
	if (req.xhr) {
		res.status(500).send('Oops, algo salio mal! Ponte en contacto con el administrador.');
	} else {
		res.status(500).send(err);
	}
});

const httpsServer = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/edificio-ramos.tk/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/edificio-ramos.tk/fullchain.pem'),
  }, app);

httpsServer.listen(8443, () => {
    console.log('HTTPS Server running on port 8443');
});
