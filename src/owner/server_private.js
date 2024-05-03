var BN = require('bn.js');

//change this
let server_priv = new BN('fca7af6578fe0cc9ec73894428032aa458ff0d6d143441ba81ee50a022df4a92', 16);

//change this
var server_password =
[
'd34067adbe7f03341e7d8b2ccf6699a2c9d1dd7fa5da492810efdd21ebe6c761',
'9a8724c532dfafeccc0f52d5ba91a19b4788b94abd1ff25e3bbda413284537c0'
]

var lock_password =
[
'79be667e f9dcbbac 55a06295 ce870b07 029bfcdb 2dce28d9 59f2815b 16f81798',
'483ada77 26a3c465 5da4fbfc 0e1108a8 fd17b448 a6855419 9c47d08f fb10d4b8'
]

const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const lock_pm = ec.curve.point(lock_password[0], lock_password[1]);

let lock_lcs = new BN('216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51e', 16);

module.exports.server_priv = server_priv;
module.exports.server_password = server_password;
module.exports.lock_pm = lock_pm;
module.exports.lock_lcs = lock_lcs;