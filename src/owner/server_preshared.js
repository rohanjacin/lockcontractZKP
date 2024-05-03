var BN = require('bn.js');
//change this
const lock_pub = [
  'e24bdf0fb1f1e50fd3f72a9f2a0d1e16b55ce0cb6dbb8586bbec634a1c615d6d',
  '21bebc2b26f6c41144699d844afd771a185b18024b001343515353958d7a4e1'
];

const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const lock_Pb = ec.curve.point(lock_pub[0], lock_pub[1]);
const shared_key = '26954ccdc99ebf34f8f1dde5e6bb080685fec73640494c28f9fe0bfa8c794543';
let server_signature = new BN('216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51e', 16);

module.exports.lock_Pb = lock_Pb;
module.exports.shared_key = shared_key;
module.exports.server_signature = server_signature;