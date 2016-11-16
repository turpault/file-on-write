var fs = require('fs');
var path = require('path');
var util = require('util');
var Stream = require('stream');

/**
 *  @param {Object} options
 *    @param {String=} options.path
 *    @param {Function=} options.filename
 *    @param {Function=} options.transform
 *    @param {String=} options.ext
 *    @param {Boolean=} options.sync
 *    @param {Object=} options.context
 */
function FileOnWrite(options) {
  options = options || {};
  this.path = options.path || "./";
  this.filename = options.filename || Date.now;
  this.transform = options.transform || function(data) { return data; };
  this.ext = options.ext || "";
  this.sync = options.sync;
  this.writable = true;
  this.context = options.context;
  this.filter = options.filter || function(data, cb) { return cb(null,true); };
  this.end = options.end || function() {};
  
  if (!fs.existsSync(this.path)) fs.mkdirSync(this.path);
}
util.inherits(FileOnWrite, Stream);

/**
 *  @param {*} data
 */
FileOnWrite.prototype.write = function(data) {
  // Build full filepath
  // If the data doesn't pass the filter, return
  var that = this;
  this.filter(data, function(err, pass) {
    if(err || !pass) 
      return;
    var file = path.join(that.path, that.filename.call(that.context, data) + that.ext);
    // Transform the data before write
    var transformedData = that.transform.call(this.context, data);
    // Write data
    if (that.sync) {
      that.end(fs.writeFileSync(file, transformedData), file);
    } else {
      fs.writeFile(file, transformedData, function(err) { 
        if (err) that.emit('error', err); 
        that.end(err, file);
      }); 
    }
  });
};

/**
 *  @param {*} data
 */
FileOnWrite.prototype.end = function(data) {
  this.write(data);
  this.writable = false;
};

FileOnWrite.prototype.destroy = function() {
  this.writable = false;
};

module.exports = FileOnWrite;
