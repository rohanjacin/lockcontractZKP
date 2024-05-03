var BN = require('bn.js');
var createHash = require( 'crypto' ).createHash;
var createHmac = require( 'crypto' ).createHmac;
const PreShared = require('./server_preshared.js');
var ServerSeed = require('./server_seed_v2.js');
var ServerSalt = require('./server_salt.js');
const Private = require('./server_private.js');

var ServerNounce;
(function() {
    var instance;

var counter = 0;

ServerNounce = function ServerNounce (ts, ct) {
    if (instance)
        return instance;

    instance = this;

    let seed = new ServerSeed();
	let salt = new ServerSalt();

	this.rpv = this.salt = this.ts = this.seed = this.ct = this.lcs = 0;
	this.init = function (_ts, _ct) {
		this.lcs = PreShared.server_signature.toBuffer(32);		
		this.ts = _ts.toBuffer(4);
		this.ct = _ct.toBuffer(2);
	}.bind(this);

	this.init(ts, ct);

    this.session = async function (time) {

    	return await seed.session.call(time);
    }.bind(this);

    this.update = function (ts_, ct_) {
    	//console.log("update nounce:");
    	this.ct = ct_;
    	
    	seed.update.call();
    	this.seed = seed.seed.toBuffer(32);
    	this.rpv_pub = seed.rpv_pub.toBuffer(32);
    	this.rpv = seed.rpv;
    	console.log("RPV(update):" + this.rpv.toString());
    	//console.log("this.rpv(updateee):"+ this.rpv);

    	salt.update.call();
    	this.salt = salt.salt.toBuffer(32);
    	this.init(ts_, ct_);
    	this.nounce = this.genNounce();
    }.bind(this);

    this.solve = function (nounce) {

    	console.log("In solve(sn):" + JSON.stringify(nounce)); 

    	return this.solveNounce(nounce, seed, salt);

    }.bind(this);    
};
}());

ServerNounce.prototype.genNounce = function () {

	let hash = createHash('sha256');
	hash.update(this.ts);
	console.log("this.rpv(genNonce):" + this.rpv);
	//hash.update(this.rpv);
	hash.update(this.lcs);
	//this.nounce0 = new BN(hash.digest('hex'), 16)this.rpv;
	//this.nounce0 = this.nounce0.toBuffer(32);

	this.nounce0 = new BN(this.rpv_pub, 16);
	this.nounce0 = this.nounce0.toBuffer(32);

	hash = createHash('sha256');
	//hash.update(this.seed);
	hash.update(this.ct);
	hash.update(this.lcs);
	this.nounce1 = new BN(hash.digest('hex'), 16);
	this.nounce1 = this.nounce1.toBuffer(32);

	//console.log("nounce1:" + this.nounce1);
/*	console.log("nounce0:" + JSON.stringify(this.nounce0));
	console.log("nounce1:" + JSON.stringify(this.nounce1));
	console.log("seed:" + JSON.stringify(this.seed));
	console.log("ct:" + JSON.stringify(this.ct));

	console.log("nounce0.length:" + this.nounce0.length);
	console.log("nounce1.length:" + this.nounce1.length);
	console.log("seed.length:" + this.seed.length);
	console.log("ct.length:" + this.ct.length);
*/
	let length = this.nounce0.length + this.nounce1.length +
				 this.seed.length + this.ct.length;

	let data = Buffer.concat([this.nounce0, this.nounce1,
					this.seed, this.ct], length);

  	var hmac = createHmac( 'sha256', PreShared.shared_key ).update( data ).digest()
  	//console.log("hmac:" + JSON.stringify(hmac));
  	length = length + hmac.length;
  	//console.log("hmac:" + hmac);
	let nounce = Buffer.concat([data, hmac], length);
	return nounce;
}

ServerNounce.prototype.solveNounce = function (nounce, seed_obj, salt_obj) {

	console.log("solveNonce:" + JSON.stringify(nounce));
	console.log("seed_obj:" + JSON.stringify(nounce));
	console.log("salt_obj:" + JSON.stringify(salt_obj));

	let nounce0 = new Buffer.from(nounce.slice(0, 65));
	let nounce1 = new Buffer.from(nounce.slice(65, 97));
	let seed = new Buffer.from(nounce.slice(97, 162));
	let counter = new Buffer.from(nounce.slice(162, 163));

	let lock_pub = nounce0;
	//let lock_pub = new BN(nounce0, 16);
	//this.lock_pub = this.lock_pub.toString();
	let lock_seed = seed;
	//let lock_seed = new BN(seed, 16);
	//this.lock_seed = this.lock_seed.toString();
	let lock_counter = new BN(counter, 16);

	let {Pm, l_seed} = seed_obj.retrieveSeed(lock_pub, lock_seed);
	Pm = Pm.getX(); Pm = Pm.toString();

	console.log("pm:" + Pm);
	if (Pm == Private.lock_pm.x.toString()) {
		console.log("\nMATCH(server)");
		return true;
	}

/*	console.log('_server_seed:' + (l_seed instanceof BN));
	let _seed = l_seed.toString(); 
	console.log("__seed:" + _seed);
	let lock_salt = salt_obj.retrieveSalt(1, 2, _seed);
	console.log("lock_salt:" + lock_salt);

	hash = createHash('sha256');
	hash.update(lock_salt.toBuffer(32));
	hash.update(lock_counter.toBuffer(32));
	hash.update(Private.lock_lcs.toBuffer(32));
	let lock_nounce1 = new BN(hash.digest('hex'), 16);
	console.log("lock_nounce1:" + lock_nounce1);

	let _nounce1 = new BN(nounce1, 16);
	console.log("nounce1111:" + _nounce1.toString());
	if (lock_nounce1.toString() == _nounce1.toString()) {
		console.log("\n\nNounce Match");
		return true;
	}*/

	return false;

/*	let hash = createHash('sha256');
	hash.update(this.ts);
	hash.update(this.rpv);
	hash.update(this.lcs);
	//this.nounce0 = new BN(hash.digest('hex'), 16);
	//this.nounce0 = this.nounce0.toBuffer(32);
	this.nounce0 = this.rpv.toBuffer(32);

	//console.log("nounce0:" + this.nounce0);
	hash = createHash('sha256');
	hash.update(this.salt);
	hash.update(this.ct);
	hash.update(this.lcs);
	this.nounce1 = new BN(hash.digest('hex'), 16);
	this.nounce1 = this.nounce1.toBuffer(32);
	//console.log("nounce1:" + this.nounce1);
	console.log("nounce0:" + JSON.stringify(this.nounce0));
	console.log("nounce1:" + JSON.stringify(this.nounce1));
	console.log("seed:" + JSON.stringify(this.seed));
	console.log("ct:" + JSON.stringify(this.ct));

	console.log("nounce0.length:" + this.nounce0.length);
	console.log("nounce1.length:" + this.nounce1.length);
	console.log("seed.length:" + this.seed.length);
	console.log("ct.length:" + this.ct.length);

	//console.log("seed.length:" + this.seed.length);
	//console.log("ct.length:" + this.ct.length);
	let length = this.nounce0.length + this.nounce1.length +
				 this.seed.length + this.ct.length;
	//console.log("length:" + length);

	let data = Buffer.concat([this.nounce0, this.nounce1,
					this.seed, this.ct], length);
	//console.log("data:" + JSON.stringify(data));

  	var hmac = createHmac( 'sha256', PreShared.shared_key ).update( data ).digest()
  	//console.log("hmac:" + JSON.stringify(hmac));
  	length = length + hmac.length;
  	//console.log("hmac:" + hmac);
	let nounce = Buffer.concat([data, hmac], length);
	//console.log("nounce:" + JSON.stringify(nounce));
	//console.log("nounce.length:" + nounce.length);
	return nounce;*/
}

let ts = new BN('216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51d', 16);
let ct = new BN('fffe', 16);;

let ts1 = new BN('316936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51d', 16);
let ct1 = new BN('ffee', 16);;

module.exports = ServerNounce;