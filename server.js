var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('../nodejs/models/user');


var port = process.env.PORT || 8080;
mongoose.connect(config.database);
app.set('superSecret',config.secret);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//use morgan to log requests to the console
app.use(morgan('dev'));

//setup first Time
app.get('/setup',function(req,res){
    var newUser = new User({
        name:'namnnh',
        password: 'password',
        admin: true
    });

    newUser.save(function(err){
        if(err) throw err;
        
        console.log('User saved successfully');
        res.json({success:true});
    });
});

var apiRoutes = express.Router();

//req.body.token=> post , req.query.token=>URL params , req.headers => post paramters(get)
apiRoutes.use(function (req,res,next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if(token){
        jwt.verify(token, app.get('superSecret'),function(err,decoded){
            if(err){
                return res.json({success: false, message:'Failed to authenticate token.'});
            }else{
                req.decoded = decoded;
                next();
            }
        });
    }else{
        return res.status(403).send({
            success:false,
            message: 'No token provided'
        })
    }
});

apiRoutes.get('/',function(req,res){
    res.json({message:'API'});
});

apiRoutes.post('/authenticate',function(req,res){
    User.findOne({
        name: req.body.name
    },function(err,user){
        if(err) throw err;

        if(!user){
            res.json({success:false,message:'Authentication failed. User not found!'});
        }else if(user){
            if(user.password != req.body.password){
                res.json({success:false,message:'Authentication failed. Wrong password'});
            }else{
                var token = jwt.sign(user,app.get('superSecret'),{expiresIn: 30});
                res.json({
                    success: true,
                    message: 'token have created successfully!',
                    token: token
                });
            }
        }
    });
});

apiRoutes.get('/users',function(req,res){
    User.find({},function(err,users){
        res.json(users);
    });
});



app.use('/api',apiRoutes);



//start server
app.listen(port);
console.log('Magic happens at http://localhost:'+port);