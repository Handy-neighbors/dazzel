var express = require('express');
var path=require('path');

var bodyParser = require('body-parser');
var app = express();
var mongoose=require('mongoose');
var dataModels = require('../database-mongo');

var cookieParser=require('cookie-parser');
var session=require('express-session');
var mongoStore=require('connect-mongo')(session);
var passport=require('passport');

// var routes=require('./userroutes')

var flash=require('express-flash');

require('../config/passport');

//middleware
app.use(express.static(__dirname + '/../react-client/dist'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(cookieParser);

app.use(session({secret:'mysecretsession',resave:true,saveUninitialized: true,

   store:new mongoStore({mongooseConnection: mongoose.connection,collection: 'session',})
 }))

app.use(passport.initialize());
app.use(passport.session());

// app.use(routes);

app.use(flash());

// set template
app.set('view engine','ejs');





app.get('/admin',function(req,res){
  res.render('admin');

})

app.get('/admin/signup',function(req,res){
  res.render('signup');
})


app.get('/admin/doctorform',function(req,res){
  res.render('doctorform');
})


app.post('/admin/doctorform',function(req,res){
  //convert adress from string to object that have two key lat and lng
  var latlngStr=req.body.address
  var latlngObj={
    lat:parseFloat(latlngStr.split(",")[0]),
    lng:parseFloat(latlngStr.split(",")[1])
  };
// we have three option here 
  if(req.body.action==="Add doctor"){
  
  //create a variable doctor_data hold all new data
  var doctor_data={
    name:req.body.name,
    specialization:req.body.specialization,
    address:latlngObj,
    tel:req.body.tel,
    rate:req.body.rate
  }

  //insert doctor_data to the database
 var newDoc=new dataModels.Doctor(doctor_data);

 
 
 newDoc.save(function(err,doc){
  if(err){
    console.log("error in saving a new doctor");

  }
  else{
    res.redirect('/admin/doctorform');
  }


 })
}else if(req.body.action==="Delete doctor"){
  // delete doctor by finding his name and delete it{ name } using deleteOne
  dataModels.Doctor.deleteOne({ 'name': req.body.name },  function (err, doctor) {
  if (err) {
    return handleError(err)
  }else{
    res.render('doctorform');
  };

});
}else{
  // modify doctor by finding his name and modify it{ name } using findone and modify data in result  
  dataModels.Doctor.findOne( { "name":req.body.name}, function(err, result){
       if (!err && result) {
        result.specialization = req.body.specialization; // update ur values goes here
        result.address = latlngObj;
        result.tel = req.body.tel;
        result.rate = req.body.rate;
        var newDoctor = new dataModels.Doctor(result);
        newDoctor.save(function(err, result2){
            if(!err) {
               res.render('doctorform')
            } else res.send(err);
        })  

       } else res.send(err);
    }); 
}

})



app.post('/admin/signup',passport.authenticate('local.signup',{
  successRedirect:'/admin',
  failureRedirct:'signup',
  failureFlash:true 
}));


app.get('/admin/login',function(req,res){
  res.render('login',{loginError:req.flash('loginError')});
})


app.post('/admin/login',passport.authenticate('local.login',{
  successRedirect:'/admin/doctorform',
  failureRedirct:'login',
  failureFlash:true 
}));

app.get('/profile',function(req,res){
    res.render('profile',{user:req.user,loginError:req.flash('loginError')});

})

app.get('/profile',function(req,res){
  req.logout();
  res.redirect('/');
})



// to get all dooctors from db
app.get('/doctors/:rateSpic', function (req, res) {
  
  dataModels.Doctor.find({specialization:req.params.rateSpic},function(err, data) {
    if(err) {
      res.sendStatus(500);
    } else {
      
      res.send(data);
    }
  }).limit(3).sort( { rate: -1} );

});

app.get('/docNearst/:spic', function (req, res) {
  console.log('aa',req.params.spic); 
  dataModels.Doctor.find({specialization:req.params.spic},function(err, data) {
    if(err) {
      res.sendStatus(500);
    } else {
      
      res.send(data);
    }
  })

});


app.listen(process.env.PORT||3000, function() {
  console.log('listening on port 3000!');
});

module.exports=app;
