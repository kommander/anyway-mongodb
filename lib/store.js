/**
 * MongoDB Object Store - Anyway.js
 */
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var util = require('util');
var Extendable = require('../../anyway/').Extendable;

var Store = module.exports = function(any, settings){
  if(!(this instanceof Store)){
    return new Store(any, settings);
  }
  
  // Inherit
  Store.super_.call(this, settings);
  
  this.any = any;
  this.AnywayCollection = any.package('objects').Collection;
  this.AnywayDocument = any.package('objects').Document;
  this.collections = {};
};

util.inherits(Store, Extendable);


/**
 * Mongo Error parsing
 */
function getErrorReason(err) {
  if(err.code == '11000') {
    var indexName = err.err.match(/.\$(.*)_./i)[1];
    return indexName + ' already exists';
  } 
  return err;
}

/**
 * Connect this store to MongoDB with given settings
 */
Store.prototype.connect = function(cb) {
  var me = this;
  var server = new mongodb.Server(this.settings.url, this.settings.port, {});
  this._db = new mongodb.Db(this.settings.db, server, { w: 1 });
  this._db.open(function (err, client) {
    if(err) {
      cb && cb(err);
      return;
    }
    
    me._dbClient = client;
    cb && cb(null);
  });
};

/**
 * Add a field to a model
 */
Store.prototype.addField = function(modelName, fieldName, options) {
  var me = this;
  
  // Ensure index for uniques
  if(options.unique === true) {
    this._db.ensureIndex(modelName, fieldName, {
      unique: true, 
      background: true, 
      dropDups: true, 
      w: 1
    }, function(err, name) {
      if(err) {
        me.emit('error', err);
      }
    });
  }
};

/**
 * Drop the whole store and all its data
 */
Store.prototype.drop = function(cb) {
  this._db.dropDatabase(function(err, result) {
    if(err) {
      cb && cb(err);
      return
    }
    cb && cb(null, result);
  });
};

/**
 * Save a document (or a list of documents) and return the document (or document list) in the callback with added id property(ies)
 *
 * @param obj {Document}
 */
Store.prototype.save = function(doc, cb) {


  // TODO: user db.collection.ensureIndex to allow uniques

  // A list of documents
  if(Array.isArray(doc)){

    var result = {
      returned: false,
      counter: 0,
      documents: new this.AnywayCollection()
    };

    // Submit save actions for possible parallel processing
    for(var i = 0; i < doc.length; i++){
      this.saveDocument(doc[i], function(err, savedDoc){
        // Forward error
        if(err && !result.returned){
          cb && cb(err);
          result.returned = true;
        }

        result.counter++;
        result.documents.push(savedDoc);

        if(result.counter == doc.length && !result.returned){
          cb && cb(null, result.documents);
        }
      });
    }

    return;
  }

  // A single document
  if(typeof doc === 'object'){
    this.saveDocument(doc, cb);
    return;
  }

};

/**
 * Save a single document
 */
Store.prototype.saveDocument = function(doc, cb) {

  var collection = this.collections[doc._type];
  if(!collection){
    collection = this.collections[doc._type] = new mongodb.Collection(this._dbClient, doc._type);
  }
    
  // TODO: Save complete object on first save
  // TODO: Only save changed attributes after already saved or after retrieved from store
  // TODO: Check if the model has unique fields and ensure index
    
  // If document.saved == true use update, otherwise use insert
  if(doc._saved === true) {
    // Update for existing document
    
    // TODO: Check changed fields and updated changed only with $set
    var update = doc.toObject();

    // Do MongoDB update
    collection.update({
      _id: doc.id
    }, 
    update, { 
      safe: true
    }, function(err, num) {
      if (err) {
        cb && cb(this.cannot('save', doc._type).because(getErrorReason(err)));
        return;
      }
      cb && cb(null, doc);
    });

  } else {
    // Insert for non-existing doc

    collection.insert(
      doc.toObject(), 
      { 
        safe:true 
      },
      function(err, objects) {

        if (err) {
          cb && cb(this.cannot('save', doc._type).because(getErrorReason(err)));
          return;
        }

        doc._saved = true;
        doc.id = objects[0]._id;

        cb && cb(null, doc);
      }
    );
  }
};

/**
 * Retrieve an object by its id
 *
 * @param type {string}
 * @param id {mixed}
 */
Store.prototype.get = function(type, id, cb) {
  type = type.toLowerCase().trim();

  var doc = null;
  var collection = this.collections[type];
  
  if(!collection){
    this.any.aCall(cb, [null, results]);
    return;
  }

  var me = this;

  // A list of documents
  if(Array.isArray(id)){
     
    var resultCollection = new me.AnywayCollection();

    collection.find(
      {
        _id: { $in: id }
      }).toArray(function(err, docs) {

        for (var i = 0; i < docs.length; i++) {
          var result = me.any.model(type).create(docs[i]);
          result.id = docs[i]._id;
          result._saved = true;
          resultCollection.push(result);
        }

        cb && cb(err, resultCollection);
      }
    );

  } else {
    // A single document
    collection.find(
      {
        _id: id
      }, {
        limit: 1
      }).nextObject(function(err, doc) {
        
        var result = me.any.model(type).create(doc);
        result.id = doc._id;
        result._saved = true;

        cb && cb(err, result);
      }
    );
  }
  
};

/**
 * Find (search) an object with mongodb query syntax
 */
Store.prototype.find = function(type, query, options, cb) {
  type = type.toLowerCase().trim();
  
  var collection = this.collection[type];
  var results = new Collection();

  if(!collection){
    this.any.aCall(cb, [null, results]);
    return;
  }

  var model = me.any.model(type);

  query._id = query.id;
  delete query.id;

  collection.find(query, options).toArray(function(err, docs) {

      if(err) {
        cb && cb(err, results);
        return;
      }

      for(var i = 0; i < docs.length; i++) {
        var result = new me.AnywayDocument(model, docs[i]);
        result.id = docs[i]._id;
        result._saved = true;
        results.push(result);
      }

      cb && cb(null, results);
    }
  );
};