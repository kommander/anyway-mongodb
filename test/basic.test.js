/**
 * Tests
 */
var expect = require('expect.js');
var sinon = require('sinon');

// Use local Anyway repo for development
var Anyway = require('../../anyway/');

//var Anyway = require('anyway');

describe('Anyway-MongoDB', function(){

 
  //
  //
  it('should load the anyway-mongodb package', function(done){
    var any = Anyway()
    .loadPackage(__dirname + '/../')
    .on('ready', function(){
      
      done();
    });
  });

 
});
