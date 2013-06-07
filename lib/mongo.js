/**
 * MongoDB Store - Anyway Package
 */

var Store = require('./store');

var Pack = module.exports = function(api, next){
  
  var store = Store(api, this.settings);
  api.documentStore('memory', store);

  if(this.settings.connect) {
    store.connect(function(err){
      next(err);
    });
    return;
  }

  next();
};

Pack.use = ['objects']

Pack.defaultSettings = {
  url: '127.0.0.1',
  db: 'anyway',
  port: 27017,
  connect: true
}