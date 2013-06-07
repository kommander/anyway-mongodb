/**
 * MongoDB Object Store - Anyway.js
 */
var mongodb = require('mongodb');
var util = require('util');
var Extendable = require('../../anyway/').Extendable;

var Store = module.exports = function(any, settings){
  if(!(this instanceof Store)){
    return new Store(any, settings);
  }
  
  // Inherit
  Store.super_.call(this, settings);
  
  this.any = any;
  this.Collection = any.package('objects').Collection;
};

util.inherits(Store, Extendable);

/**
 * Connect this store to MongoDB with given settings
 */
Store.prototype.connect = function(cb) {
  var me = this;
  var server = new mongodb.Server(this.settings.url, this.settings.port, {});
  new mongodb.Db(this.settings.db, server, { w: 1 }).open(function (err, client) {
    if(err) {
      cb && cb(err);
      return;
    }
    
    me._dbClient = client;
    cb && cb(null);
  });
};

/**
 * Save a document (or a list of documents) and return the document (or document list) in the callback with added id property(ies)
 *
 * @param obj {Document}
 */
Store.prototype.save = function(doc, cb) {
  
};

/**
 * Save a single document
 */
Store.prototype.saveDocument = function(doc, cb) {
  
};

/**
 * Retrieve an object by its id
 *
 * @param type {string}
 * @param id {mixed}
 */
Store.prototype.get = function(type, id, cb) {
  
};

/**
 * Find (search) an object with mongodb syntax, translated by object store according to storage strategy
 */
Store.prototype.find = function(type, query, cb) {
  
};