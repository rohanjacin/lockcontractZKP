var BN = require('bn.js');
var createHash = require( 'crypto' ).createHash;
var ServerSeed = require('./server_seed_v2.js');

var ServerSalt;
(function() {
    var instance;

var counter = 0;

ServerSalt = function ServerSalt () {
    if (instance)
        return instance;

    counter++;

    instance = this;

    let ls = new ServerSeed();
    this.startTs = this.endTs = this.seed = 0;

    this.session = function () {
        //console.log("session salt:");
    }.bind(this);

    this.update = function () {
    	//console.log("update salt:");
        this.seed = ls.seed.toBuffer(32);
    	this.salt = this.genSalt(1, 2);
    }.bind(this);    
};
}());

ServerSalt.prototype.genSalt = function (start, period) {
	this.start = start;
	this.end = start + period;
	let hash = createHash('sha256');
	hash.update(this.seed);
	let salt = hash.digest('hex');
	salt = new BN(salt, 16);
	console.log('salt:' + salt);
	return salt;
}

ServerSalt.prototype.retrieveSalt = function (start, period, seed) {
    let end = start + period;
    let hash = createHash('sha256');
    hash.update(seed);
    let salt = hash.digest('hex');
    salt = new BN(salt, 16);
    console.log('salt:' + salt);
    return salt;
}

module.exports = ServerSalt;
