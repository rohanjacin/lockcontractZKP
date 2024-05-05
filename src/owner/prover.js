const snarkjs = require("snarkjs");
const fs = require("fs");
const ServerSeed = require('./server_seed_v2.js');
const BN = require("bn.js");

class LockProver {
    constructor () {
        let cipherPt1 = [];
        let cipherPt2 = [];
        let privkey = [];
        let expectedPm = [];

        this.update = function ()  {
            let seed = new ServerSeed();

            console.log("In prover update:" + Object.keys(seed));

            // private inputs
            privkey = bigint_to_array(64, 4, seed.rpv);
            console.log("privkey:" + JSON.stringify(privkey));

            expectedPm[0] = bigint_to_array(64, 4, seed.lock_pm.x);
            expectedPm[1] = bigint_to_array(64, 4, seed.lock_pm.y);
            console.log("expectedPm:" + JSON.stringify(expectedPm));

            // public inputs
            cipherPt1[0] = bigint_to_array(64, 4, seed.cipherPt1.x);
            cipherPt1[1] = bigint_to_array(64, 4, seed.cipherPt1.y);
            console.log("cipherPt1:" + JSON.stringify(cipherPt1));

            cipherPt2[0] = bigint_to_array(64, 4, seed.cipherPt2.x);
            cipherPt2[1] = bigint_to_array(64, 4, seed.cipherPt2.y);
            console.log("cipherPt2:" + JSON.stringify(cipherPt2));
        }

        this.prove = async function () {
            let input = {cipherpoint1: [cipherPt1[0], cipherPt1[1]], cipherpoint2: [cipherPt2[0], cipherPt2[1]],
                 privkey: privkey, expectedPm: [expectedPm[0], expectedPm[1]]};

            console.log("Input:" + JSON.stringify(input));

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input, "/home/bosco/projects/lockcontractZKP/src/owner/lockproof.wasm",
                "/home/bosco/projects/lockcontractZKP/src/owner/lockproof_final.zkey");

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
  LockProver: LockProver
};