var elliptic = require('elliptic');
var EC = elliptic.ec;

var HS_Curve;
(function() {
    var instance;

var counter = 0;

HS_Curve = function HS_Curve () {
    if (instance)
        return instance;

    counter++;
    instance = this;
	this.ec_mon = new EC('curve25519');
	this.ec_ed = new EC('ed25519');
	this.ec_secp256k1 = new EC('secp256k1');

    return instance;
};
}());

/*HS_Curve.prototype.getPoint = function (x) {
	let ed_point = {x: x, z:' 1'};
	let mon_point = this.ec_mon.curve.point(ed_point.x, ed_point.z);
	return mon_point;
}*/

HS_Curve.prototype.getCurve = function (type) {
	if (type == 'ed25519')
		return this.ec_ed.curve;
	else if (type == 'curve25519')
		return this.ec_mon.curve;
	else if (type == 'secp256k1')
		return this.ec_secp256k1.curve;
}

HS_Curve.prototype.getRandPrivPoint = function (type) {
	let ec; 
	if (type == 'ed25519')
		ec = this.ec_ed;
	else if (type == 'curve25519')
		ec = this.ec_mon;
	else if (type == 'secp256k1')
		ec = this.ec_secp256k1;

	let s = ec.genKeyPair();

	return s;
}

HS_Curve.prototype.retrieveRandPrivVar = function (type, point) {
	let ec; 
	if (type == 'ed25519')
		ec = this.ec_ed;
	else if (type == 'curve25519')
		ec = this.ec_mon;
	else if (type == 'secp256k1')
		ec = this.ec_secp256k1;

	let secret = ec.keyFromPublic(point);

	return secret;
}

HS_Curve.prototype.createPoint = function (type, x) {
	let ec; 
	if (type == 'ed25519')
		ec = this.ec_ed;
	else if (type == 'curve25519')
		ec = this.ec_mon;
	else if (type == 'secp256k1')
		ec = this.ec_secp256k1;

	let point = ec.curve.pointFromX(x, true);

	return point;
}

HS_Curve.prototype.createPointFromPublic = function (type, p) {
	let ec; 
	if (type == 'ed25519')
		ec = this.ec_ed;
	else if (type == 'curve25519')
		ec = this.ec_mon;
	else if (type == 'secp256k1')
		ec = this.ec_secp256k1;

	let point = ec.keyFromPublic(p, 'string');

	return point.getPublic();
}

HS_Curve.prototype.encodePointForCipher = function (type, p) {
	let ec; 
	if (type == 'ed25519')
		ec = this.ec_ed;
	else if (type == 'curve25519')
		ec = this.ec_mon;
	else if (type == 'secp256k1')
		ec = this.ec_secp256k1;

	return p.encode('string', null);
}

module.exports = HS_Curve;