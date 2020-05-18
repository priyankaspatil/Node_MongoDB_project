const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Favorites.find({})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        // console.log("Found all favorites: ", favorites);

        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(favorites);
    },
    (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id}, (err, favorites) => {
        if (err) {
            return done(err, false);
        }
        if(!err && favorites != null) {
            if(favorites.dishes.indexOf(req.body._id) != -1){
                for (var i=0; i<req.body.length; i++) {
                    if (favorites.dishes.indexOf(req.body[i]._id) === -1) {
                        favorites.dishes.push(req.body[i]._id);
                    }
                }
                favorites.save()
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type','application/json');
                    res.json(favorites);
                },
                (err) => next(err));
            }
            else {
                err = new Error('Dish ' + req.body._id + 'is already in your favorites list.')
                err.status = 404;
                return next(err);
            }
            
        }
        else {
            Favorites.create({user: req.user._id})
            .then((favorite) => {
                if(favorite != null) {
                    favorite.dishes.push(req.body);
                    favorite.save()
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type','application/json');
                        res.json(favorite);
                    },
                    (err) => next(err));
                }
                console.log("favorite created :", favorite);
            },
            (err) => next(err))
            .catch((err) => next(err));
        }
    })
    
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.remove({})
    .then((response) => {
        console.log("favorites removed :", response);
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(response);
    },
    (err) => next(err))
    .catch((err) => next(err));
    
});


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if(favorite != null && favorite.dishes.indexOf(req.params.dishId) === -1) {
            favorite.dishes.push(req.params.dishId);
            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);
            },
            (err) => next(err));
        }
        else if(favorite != null && favorite.dishes.indexOf(req.params.dishId) != -1) {
            err = new Error('Dish ' + req.params.dishId + 'is already in your favorites list.')
            err.status = 404;
            return next(err);
        }
        else {
            favorite = new Favorites({user: req.user._id})
            favorite.dishes = req.params.dishId;
            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);
            },
            (err) => next(err));
        }

    })
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if(favorite != null && favorite.dishes.indexOf(req.params.dishId) != -1) {
            for( var i = (favorite.dishes.length - 1); i >= 0; i--) {
                if (favorite.dishes[i] === (req.params.dishId)) {
                    favorite.dishes[i].remove();
                }
            }
            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);
            },
            (err) => next(err));
        }
    },
    (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;