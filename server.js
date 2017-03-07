var express = require('express'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    app = express(),
    bodyParser = require('body-parser'),
    http = require('http'),
    unirest = require('unirest'),
    db;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(express.static(__dirname));

mongoose.connect('mongodb://Rakeshpatel87p:printer1@ds023644.mlab.com:23644/art_smart', function(err, database) {
    if (err) {
        console.log('Error connecting to database ', err)
        process.exit(1)
    }
    db = database
    var server = app.listen(process.env.PORT || 8000, function() {
        var port = server.address().port;
        console.log('Connected Captain. Safe journey.');
        console.log('App now running on port', port);
    });
});

var userProfile = mongoose.Schema({
    user: { type: String },
    // Get this to take in more arguments - what's the best structure? One to many?
    artWorksOnRotation: [],
    // [{ type: Schema.Types.ObjectId, ref: 'PaintingAttributes', index: true }],
    artWorksLiked: [{ type: String }],
    dateRotationWasUpdate: { type: String }
});
var paintingAttributes = mongoose.Schema({
    image_id: { type: String },
    title: { type: String },
    date: { type: String },
    artist: {type: String},
    collecting_institution: { type: String },
    url: { type: String },
    special_notes: { type: String }
});

var UserProfile = mongoose.model('UserProfile', userProfile);
var PaintingAttributes = mongoose.model('PaintingAttributes', paintingAttributes)

// Creates New User Profile, adding start-kit artworks
app.post('/newUser', function(req, response) {
    UserProfile.create({
        user: req.body.user,
        dateRotationWasUpdate: getDate()
    }, function(err, newUser) {
        if (err) {
            return response.status(500).json(err)
        }
        // PaintingAttributes.find({ special_notes: "starter_kit" })
        // .populate('PaintingAttributes')
        // .exec (function(err, newEntry){
        //     console.log(newEntry)
        // })
        PaintingAttributes.find({ special_notes: "starter_kit" }, function(err, starter_kit) {
            if (err) {
                return response.status(500).json(err)
            }
            urls = starter_kit.map(function(obj) {
                return obj.url;
            })
            UserProfile.update({ _id: newUser._id }, { artWorksOnRotation: starter_kit }, function(err, updatedUser) {
                if (err) {
                    console.log(err, 'error');
                }
            });
        })
        response.json(newUser)
        console.log('new user created--------', newUser)
    })
});

// Adds new pieces of artwork to mongoose
app.post('/addingArt', function(req, response) {
    var newItem = new PaintingAttributes({
        image_id: req.body.image_id,
        title: req.body.title,
        date: req.body.date,
        artist: req.body.artist,
        collecting_institution: req.body.institution,
        url: req.body.url,
        special_notes: req.body.special_notes

    });
    newItem.save(function(err, newPaintingAdded) {
        if (err) {
            response.json(err)
        }

        response.json(newPaintingAdded)
    })
});

// Gets artwork from artsy
app.get('/artworks/:id', function(req, response) {
    var id = req.params.id;
    unirest.post('https://api.artsy.net/api/tokens/xapp_token')
        .headers({ 'Accept': 'application/json' })
        .send({ "client_id": "cd7051715d376f899232", "client_secret": "de9378d3d12c2cbfb24221e8b96d212c" })
        .end(function(res) {
            unirest.get('https://api.artsy.net/api/artworks/' + id)
                .headers({ 'Accept': 'application/json', 'X-XAPP-Token': res.body.token })
                .end(function(res_) {
                    console.log(res_.body)
                    response.json(res_.body)
                })
        });
});

// Update User Painting
// similar_to_artwork_id reproduces same results for every painting - NOT viable
// similar_to_artist_id does not work either
// Change API:  Harvard Art Museum (submitted request); 
//              Walters Art Museum (account created);
//              NY Public Library
app.get('/:user/paintingsToDisplay', function(req, response) {
    var user = req.params.user
    UserProfile.findOne({ user: user }, function(err, user) {
        if (err) {
            return response.status(500).json(err)
        }
        console.log('here');
        console.log('returning response', user)
        response.status(201).json(user.artWorksOnRotation)
            // if (user.dateRotationWasUpdate !== getDate()) {
            //     console.log('Getting new paintings for the day')
            //         // Make Call and Update Array
            //     unirest.post('https://api.artsy.net/api/tokens/xapp_token')
            //         .headers({ 'Accept': 'application/json' })
            //         .send({ "client_id": "cd7051715d376f899232", "client_secret": "de9378d3d12c2cbfb24221e8b96d212c" })
            //         .end(function(res) {
            //             // What additional artworks will I provide?
            //             unirest.get('https://api.artsy.net/api/artworks/' + id)
            //                 .headers({ 'Accept': 'application/json', 'X-XAPP-Token': res.body.token })
            //                 .end(function(res_) {
            //                     console.log(res_.body)
            //                     response.json(res_.body)
            //                 })
            //         });
            //     // Update date of user.dateRotationWasUpdated
            // } else {
            //     response.status(201).json(user.artWorksOnRotation);

        // }
    })
});

var getDate = function() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    return newdate = year + "/" + month + "/" + day;
}

// app.listen(process.env.PORT || 8080);
exports.app = app;
