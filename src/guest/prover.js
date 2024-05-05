const snarkjs = require("snarkjs");
const fs = require("fs");
const BN = require("bn.js");

class GuestProver {
    constructor () {

        this.prove = async function (_r, _s, _pubkey, _msghash) {
            let msghash = [];
            let pubkey = [];
            let r = [];
            let s = [];

            // public inputs
            r = bigint_to_array(64, 4, _r);
            console.log("r:" + JSON.stringify(r));

            s = bigint_to_array(64, 4, _s);
            console.log("s:" + JSON.stringify(s));

            _msghash = _msghash.split('0x'); 
            _msghash = new BN(_msghash[1], 16);

            msghash = bigint_to_array(64, 4, _msghash);
            console.log("msghhash:" + JSON.stringify(msghash));

            pubkey[0] = bigint_to_array(64, 4, _pubkey.x);
            pubkey[1] = bigint_to_array(64, 4, _pubkey.y);
            console.log("pubkey:" + JSON.stringify(pubkey));

            let input = {pubkey: [pubkey[0], pubkey[1]], msghash: msghash,
                 r: r, s: s};

            console.log("Input:" + JSON.stringify(input));

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input, "/home/bosco/projects/lockcontractZKP/src/guest/guestproof.wasm",
                "/home/bosco/projects/lockcontractZKP/src/guest/guest_final.zkey");

            const calldataBlob = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
            console.log("\n\ncalldataBlob:" + calldataBlob);
            const calldata = JSON.parse("[" + calldataBlob + "]");
            console.log("\n\ncalldata:" + calldata);

            return { proof: [calldata[0], calldata[1], calldata[2]], publicSignals: calldata[3] };
        }        
    }
}

function bigint_to_array(n, k, x) {
    let mod = 1n;
    let idx;
    for (idx = 0; idx < n; idx++) {
        mod = mod * 2n;
    }

    //let ret = new BigInt64Array(k);
    let ret = [];
    let num_str
    let x_temp = BigInt(x);

    for (idx = 0; idx < k; idx++) {
        num_str = (x_temp % mod).toString(); 
        ret.push(num_str);
        x_temp = x_temp / mod;
    }
    return ret;
}

module.exports = {
  GuestProver: GuestProver
};