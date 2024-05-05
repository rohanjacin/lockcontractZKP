const HSCurve = require('./hs_curve25519.js');
const PreShared = require('./server_preshared.js');
const Private = require('./server_private.js');
const BN = require('bn.js');

var pm;
var ServerSeed;
(function() {
    var instance;

var counter = 0;

ServerSeed = function ServerSeed () {
    if (instance)
        return instance;

    counter++;

    instance = this;
    this.hscurve = new HSCurve();
	var C = this.hscurve.getCurve('secp256k1');

	this.seed = this.rpv = this.rp = 0, this.pub = 0;
	this.pswd = Private.server_password;
	this.lock_pm = Private.lock_pm;
	this.lock_pub = 0;
	this.cipherPt1 = 0;
	this.cipherPt2 = 0;

	this.Pm = C.point(this.pswd[0], this.pswd[1]);
	console.log("PM:" + this.Pm.x);
	if (this.Pm.validate()) {
		//console.log("this.Pm Valid point on curve");
	}
	else {
		console.log("this.Pm InValid point on curve");
		return;
	}

    this.session = async function (time) {
    	//console.log("start seed session. ts:" + time);
    	return await this.genRPV();
    }.bind(this);

    this.update = function () {
    	//console.log("update seed:");
    	this.genSeed(this.lock_pm, this.lock_pub);
    }.bind(this);
};
}());

ServerSeed.prototype.genRPV = async function () {
	let point = this.hscurve.getRandPrivPoint('secp256k1');
	//let lock_pub = PreShared.lock_Pb;

	if (point.validate()) {
		//console.log("Valid point on curve");
	}
	else {
		console.log("Point P1 InValid point on curve");
		return ret;
	}

	let priv = point.getPrivate('hex'); //'hex'
	//console.log("RPV:" + priv);
	this.rpv = new BN(priv, 16);
	console.log("RPV:" + this.rpv.toString());

	let pub1 = point.getPublic();
	console.log("pub1.x:" + pub1.x);
	console.log("pub1.y:" + pub1.y);
	this.pub = point.getPublic('string');
	console.log("pub:" + this.pub);
	this.rpv_pub = new BN(this.pub, 16);
	console.log("this.rpv_pub:" + this.rpv_pub);
	return {Pb: this.rpv_pub};
}

ServerSeed.prototype.genSeed = function (pm, lock_pub) {

	let ret = false;

	if (lock_pub.validate()) {
		console.log("lock_pub Valid point on curve");
	}
	else {
		console.log("lock_pub InValid point on curve");
		return ret;
	}

	let cipher_point_1 = this.pub;

	console.log("cipher_point_1:" + cipher_point_1);

	let cipher_point_2 = lock_pub;

	cipher_point_2 = cipher_point_2.mul(this.rpv);
	cipher_point_2 = cipher_point_2.add(pm);

	console.log("ENC cipher_point_2.x:" + cipher_point_2.x);
	console.log("ENC cipher_point_2.y:" + cipher_point_2.y);

	if (cipher_point_2.validate()) {
		console.log("seed valid point on curve");
	}
	else {
		console.log("seed invalid point on curve");
		return ret;
	}

	this.seed = this.hscurve.encodePointForCipher('secp256k1', cipher_point_2);
	this.seed = new BN(this.seed, 16);

	console.log("ENC seed:" + this.seed);

	console.log("pm.x:" + pm.x);
	console.log("pm.y:" + pm.y);
	console.log("cipher_point_2.x:" + cipher_point_2.x);
	console.log("cipher_point_2.y:" + cipher_point_2.y);

	ret = true;
	return ret;
}

ServerSeed.prototype.retrieveSeed = function (pub, seed) {

	let cipher_point_1 = this.hscurve.createPointFromPublic('secp256k1', pub);
	let cipher_point_2 = this.hscurve.createPointFromPublic('secp256k1', seed);

	let ret = false;
	let server_priv = Private.server_priv;
	//let lock_priv = Private.lock_priv;

	console.log("cipher 1.x:" + cipher_point_1.x);
	console.log("cipher 1.y:" + cipher_point_1.y);
	console.log("cipher 2.x:" + cipher_point_2.x);
	console.log("cipher 2.y:" + cipher_point_2.y);
	if (cipher_point_1.validate()) {
		//console.log("Valid point on curve");
	}
	else {
		console.log("Cipher P1 InValid point on curve");
		return ret;
	}

	console.log("cipher_point_1.x:" + cipher_point_1.x);
	console.log("cipher_point_2.y:" + cipher_point_2.y);

	if (cipher_point_2.validate()) {
		//console.log("Valid point on curve");
	}
	else {
		console.log("Cipher P2 InValid point on curve");
		return ret;
	}

	this.cipherPt1 = cipher_point_1;
	this.cipherPt2 = cipher_point_2;

	//console.log("server private key:" + server_priv);
	//console.log("lock private key:" + lock_priv);

	console.log("cipher_point_1.inspect:" + cipher_point_1.inspect());
	let shared = cipher_point_1.mul(this.rpv); //[b(kG)]
	//let shared = cipher_point_1.mul(lock_priv); //[b(kG)]
	console.log("shared.x:" + shared.x);
	console.log("shared.y:" + shared.y);
	console.log("shared(inspect):" + shared.inspect());
	shared = shared.neg();
	console.log("neg shared.x:" + shared.x);
	console.log("neg shared.y:" + shared.y);

	let Pm = cipher_point_2.add(shared); //(Pm+[k]Pbob)−[b]([k]G)=Pm+[kb]G−[bk]G=Pm

	console.log("Pm.x:" + Pm.x);
	console.log("Pm.y:" + Pm.y);

	if (Pm.validate()) {
		console.log("\n\nPm valid point on curve");
		this.lock_pm = Pm;
	}
	else {
		console.log("Pm invalid point on curve");
		return ret;
	}

	let secret = this.hscurve.retrieveRandPrivVar('secp256k1', cipher_point_1);

	//console.log("SECRET:" + JSON.stringify(secret));
	if (secret.validate()) {
		//console.log("Secret Valid point on curve");
	}
	else {
		console.log("Secret InValid point on curve");
		return;
	}

	this.lock_Pm = Pm;
	this.lock_pub = cipher_point_1;

	return {Pm, l_seed: this.lock_seed};
}

module.exports = ServerSeed;