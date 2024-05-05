const ethers = require("ethers");
const elliptic = require('elliptic');
const EC = elliptic.ec;
const ec = new EC('secp256k1');
const BN = require("bn.js");

const testfun = async function () {
// Create a wallet to sign the hash with
let wallet = ethers.Wallet.createRandom();
let pubkey = wallet.publicKey;
let pubkey1 = pubkey.split("0x");
console.log("pppub:" + pubkey1);
//return;
let provider = ethers.getDefaultProvider("http://localhost:8545");

console.log("provider:" + Object.keys(provider));

console.log(wallet.address);
// "0x14791697260E4c9A71f18484C9f997B308e59325"

console.log("wallet.pubkey:" + pubkey);

let point = ec.curve.decodePoint(pubkey1[1], 'hex');
console.log("point.x:" + point.x);
console.log("point.y:" + point.y);

let point_x = new BN(point.x);
let point_y = new BN(point.y);

let pubpoint_x = bigint_to_array(64, 4, point_x);
let pubpoint_y = bigint_to_array(64, 4, point_y);

console.log("pubpoint_x:" + pubpoint_x);
console.log("pubpoint_y:" + pubpoint_y);

//let pub = point.getPublic();
//console.log("pub:" + pub);

//let contractAddress = '0x80F85dA065115F576F1fbe5E14285dA51ea39260';
//let contract = new ethers.Contract(contractAddress, abi, provider);

// The hash we wish to sign and verify
let messageHash = ethers.id("Hello World");

console.log("messageHash:" + messageHash);
let temphash = messageHash.split('0x'); 

let msghashnum = new BN(temphash[1], 16);
console.log("msghashnum:" + msghashnum);

let msghhash = bigint_to_array(64, 4, msghashnum);
console.log("msghhash:" + msghhash);

// Note: messageHash is a string, that is 66-bytes long, to sign the
//       binary value, we must convert it to the 32 byte Array that
//       the string represents
//
// i.e.
//   // 66-byte string
//   "0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba"
//
//   ... vs ...
//
//  // 32 entry Uint8Array
//  [ 89, 47, 167, 67, 136, 159, 199, 249, 42, 194, 163,
//    123, 177, 245, 186, 29, 175, 42, 92, 132, 116, 28,
//    160, 224, 6, 29, 36, 58, 46, 103, 7, 186]

let messageHashBytes = ethers.getBytes(messageHash);
console.log("messageHashBytes:" + messageHashBytes);

// Sign the binary data

let sig1;
await import ('@noble/secp256k1').then((module) => {
	console.log("imported");
	let privateKey = 88549154299169935420064281163296845505587953610183896504176354567359434168161n;
	let privarray = bigint_to_Uint8Array(privateKey);
	//console.log("privarray:" + privarray);
	//console.log("typeof(privarray):" + typeof(privarray));
	console.log("istyped(privarray):" + ArrayBuffer.isView(privarray));

    let pubkey1 = module.Point.fromPrivateKey(privateKey);
    let pk_x = bigint_to_array(64, 4, pubkey1.x)
    let pk_y = bigint_to_array(64, 4, pubkey1.y)
    console.log("pk_x:" + pk_x);
    console.log("pk_y:" + pk_y);

	console.log("messageHashBytes:" + messageHashBytes);

	let fun = async function () {
		sig1 = await module.sign(messageHashBytes, bigint_to_Uint8Array(privateKey), {canonical: true, der: false});
		console.log("sig1:" + JSON.stringify(sig1));

		let r = sig1.slice(0, 32);
		let r_bigint = Uint8Array_to_bigint(r);
		let s = sig1.slice(32, 64);
		let s_bigint = Uint8Array_to_bigint(s);

		let r_array = bigint_to_array(64, 4, r_bigint);
		let s_array = bigint_to_array(64, 4, s_bigint);
		console.log("sig_r:" + r_array);
		console.log("sig_s:" + s_array);
	}
	fun();
});

//let flatSig = await wallet.signMessage(messageHashBytes);
//console.log("flatSig:" + flatSig);	

// For Solidity, we need the expanded-format of a signature
//let sig = ethers.Signature.from(flatSig);
//console.log("sig.r:" + sig.r);	
//console.log("sig.s:" + sig.s);	
//console.log("sig.v:" + sig.v);	

//let sigr = sig.r.split("0x");
//let sigs = sig.s.split("0x");
//sigr = sigr[1];
//sigs = sigs[1];
//console.log("sigr:" + sigr);
//console.log("sigs:" + sigs);

//let siggr = new BN(sigr, 16);
//let siggs = new BN(sigs, 16);

//let sig_r = bigint_to_array(64, 4, siggr);
//let sig_s = bigint_to_array(64, 4, siggs);

// Call the verifyHash function
//let recovered = await contract.verifyHash(messageHash, sig.v, sig.r, sig.s);

//console.log(recovered);
// "0x14791697260E4c9A71f18484C9f997B308e59325"

}

testfun();

function bigint_to_array(n, k, x) {
    let mod = 1n;
    for (var idx = 0; idx < n; idx++) {
        mod = mod * 2n;
    }

    //let ret = new BigInt64Array(k);
    let ret = [];
    var x_temp = BigInt(x);

    for (var idx = 0; idx < k; idx++) {
        ret.push(x_temp % mod);
        x_temp = x_temp / mod;
    }
    return ret;
}

// bigendian
function Uint8Array_to_bigint(x) {
    let ret = 0n;
    for (var idx = 0; idx < x.length; idx++) {
        ret = ret * 256n;
        ret = ret + BigInt(x[idx]);
    }
    return ret;
}

// bigendian
function bigint_to_Uint8Array(x) {
    var ret1 = new Uint8Array(32);
    console.log("typeof(ret):" + typeof ret1);
    console.log("istyped:" + ArrayBuffer.isView(ret1));
    for (var idx = 31; idx >= 0; idx--) {
        ret1[idx] = Number(x % 256n);
        x = x / 256n;
    }
    return ret1;
}


/*pppub:,023c9cf8007281015252bcad3e19cc346721331922aec08f28b5de780ebc34026f
provider:
0xe3646260F0DEa17D7fcb6442657921A01838ce9F
wallet.pubkey:0x023c9cf8007281015252bcad3e19cc346721331922aec08f28b5de780ebc34026f
point.x:27416110702254086213511948370067334170483639432315695051923390791048274117231
point.y:12714409215066926149055977985914049360243474458691653839266498992189785578142
pubpoint_x:13105043970377122415,2392283463815302952,5961830488964084839,4367638419447284050
pubpoint_y:4233587324243745438,9644605738104631627,6102280867628257650,2025522247535103182
messageHash:0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba
msghashnum:40340039748299835169756547746037309976814975367605249759025889748097184499642
msghhash:440548170857383866,12622002629612708064,3081204846736816669,6426539101777807353
messageHashBytes:89,47,167,67,136,159,199,249,42,194,163,123,177,245,186,29,175,42,92,132,116,28,160,224,6,29,36,58,46,103,7,186
imported
typeof(ret):object
istyped:true
istyped(privarray):true
messageHashBytes:89,47,167,67,136,159,199,249,42,194,163,123,177,245,186,29,175,42,92,132,116,28,160,224,6,29,36,58,46,103,7,186
typeof(ret):object
istyped:true
sig1:{"0":86,"1":178,"2":203,"3":34,"4":61,"5":122,"6":26,"7":88,"8":28,"9":30,"10":126,"11":237,"12":228,"13":137,"14":215,"15":231,"16":255,"17":31,"18":111,"19":155,"20":143,"21":69,"22":98,"23":210,"24":65,"25":163,"26":21,"27":46,"28":94,"29":47,"30":223,"31":245,"32":122,"33":143,"34":54,"35":42,"36":59,"37":1,"38":42,"39":251,"40":97,"41":20,"42":71,"43":186,"44":179,"45":30,"46":203,"47":227,"48":110,"49":172,"50":152,"51":132,"52":237,"53":0,"54":249,"55":42,"56":233,"57":135,"58":100,"59":27,"60":118,"61":73,"62":191,"63":157}
sig_r:4729647322562027509,18383534917863957202,2026196442569889767,6247278981037038168
sig_s:16827528601804586909,7974916736845674794,6995294988407852003,8831336949303290619
bosco@bosco:~/projects/lockcontractZKP/src/guest$ 
*/