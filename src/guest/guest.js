const hre = require("hardhat");
const { HandshakeIntf } = require("./interface/handshake_intf.js");
var hsm = require('./interface/hsm.js');
const BN = require("bn.js");
const createHash = require( 'crypto' ).createHash;
const prompt = require("prompt-sync")({sigint: true});
const { GuestProver } = require("./prover.js");
const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const { generateProof } = require("@semaphore-protocol/proof");
const fs = require("fs");

class LockNetwork extends HandshakeIntf {
	constructor(_privKey) {
		super();
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		this.guest = null;
    this.guestaddress = null;
    this.owner = null;
    //this.guestprover = new GuestProver();
    this.ownerGroup = null;
    this.proof = null;
    this.group = null;
    this.identity = null;
    this.secret = 'guestsecret';

    this.buildContractEventHandler();

    // Using Semaphore-protocol for identity 
    // proofs for group membership (so that family
    // members can skip placing a bid for the room)
    let createMembership = function () {

      fs.readFile('groupPreshared.json', function (err, data) {
          if (err) throw err;
          
          let _group = JSON.parse(data);
          this.secret = _group.secret;
          console.log("secret:" + this.secret);
          
          this.ownerGroup = new Group(_group.group[0]);

          let member = [this.ownerGroup.members[0], this.ownerGroup.members[1],
                         this.ownerGroup.members[2]];
          let root = this.ownerGroup.root;

          // Create the group for contract interaction 
          this.group = {member, root};
          this.identity = new Identity(this.secret);

          if (-1 != this.ownerGroup.indexOf(this.identity.commitment))
            console.log("Identity part of owner group");

      }.bind(this));

    }.bind(this);

    createMembership();
    console.log("Lock net init.");
  }
}

// Connects to the Lock contract
LockNetwork.prototype.connect = async function () {

  this.Lock = await hre.ethers.getContractFactory('LockZKP', {
    libraries: {
      Auction: '0x5fbdb2315678afecb367f032d93f642f64180aa3'
    }    
  });

	this.samplelock = await this.Lock.attach('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');
	
	console.log(`Attached to LockNetwork contract`);
  let _guests = await hre.ethers.getSigners();
  this.guest = _guests[process.env.SIGNER_INDEX];
  this.guestaddress = await this.guest.getAddress();
	this.registerEvents();
}

LockNetwork.prototype.registerEvents = async function () {

  filter = this.samplelock.filters.BidRoomNow(null, null);
  this.samplelock.on(filter, (result) => {
    console.log("Owner started the auction..");
    console.log("Owner:" + result.args.owner);
    this.owner = result.args.owner;

    this.requestRoom();   
  });

	filter = this.samplelock.filters.GuestApproved(this.guest, null, null, null);
	this.samplelock.on(filter, async (result) => {

		console.log("We have been approved by owner..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Nonce:" + result.args.nonce);
    console.log("Signature:" + result.args.signature);


		let _nonce = result.args.nonce;
		_nonce = _nonce.split("0x");
    nonce = Buffer.from(_nonce[1], 'hex');

    let guestaddress = this.guestaddress.split("0x");
    guestaddress = Buffer.from(guestaddress[1], 'hex');

    let validation = await this._verifyAndSignNonce(nonce, result.args.owner,
          result.args.signature, guestaddress);
    this.sendRequest(_nonce[1], validation);

		return;
	});

  filter = this.samplelock.filters.RespondAuth(null, this.guest, null, null, null);
  this.samplelock.on(filter, async (result) => {

    console.log("We have been approved by owner..");
    console.log("Guest:" + result.args.guest);
    console.log("Owner:" + result.args.owner);
    console.log("Owner verified?:" + result.args.isOwnerVerfied);
    console.log("Nonce:" + result.args.nonce);
    console.log("Signature:" + result.args.signature);

    let nonce = result.args.nonce;

    let nonce0 = nonce[0].split("0x");
    let nonce1 = nonce[1].split("0x");
    let seed = nonce[2].split("0x");
    let counter = nonce[3].split("0x");
    let hmac = nonce[4].split("0x");

    nonce0 = new BN(nonce0[1], 16).toBuffer(65);
    nonce1 = new BN(nonce1[1], 16).toBuffer(32);
    seed = new BN(seed[1], 16).toBuffer(65);
    counter = new BN(counter[1], 16).toBuffer(1);
    hmac = new BN(hmac[1], 16).toBuffer(32);

    let respnonce = Buffer.concat([nonce0, nonce1, seed, counter, hmac],
                 nonce0.length + nonce1.length + seed.length +
                 counter.length + hmac.length);
    console.log("Nonce is:" + JSON.stringify(respnonce));
    console.log("Nonce(len):" + respnonce.length);

    let guestaddress = this.guestaddress.split("0x");
    guestaddress = Buffer.from(guestaddress[1], 'hex');

    let validation = await this._verifyAndSignNonce(respnonce,
          result.args.owner, result.args.signature, guestaddress);
    this.sendChallenge(respnonce, this.secret, validation);

    return;
  });  	
}

// Registers for event from the lock handshake interface which
// communicates with the Lock handshake protocol
LockNetwork.prototype.buildContractEventHandler = async function () {
	this.on('contract_event', function (event, data) {

		if (event == 'challenge') {
			console.log("Solving the challenge");
			this.reqAuth(data);
		}
		else if (event == 'response') {
			console.log("Creating the challenge (response)");
		}				
	}.bind(this));
}

LockNetwork.prototype._verifyAndSignNonce = async function (data, owner,
                                  ownersig, guestaddress) {
    let hash = createHash('sha256');
    hash.update(data);
    hash.update(guestaddress);
    let msg = hash.digest();

    // Verify owner's signature
    let address = hre.ethers.verifyMessage(msg, ownersig);

    if (owner == address) {
      console.log("Owner verified");
      this.owner = owner;
    }

    // Sign
    ownersig = ownersig.split("0x");
    ownersig = Buffer.from(ownersig[1], 'hex');

    hash = createHash('sha256');
    hash.update(ownersig);
    msg = hash.digest();

    let guestsig = await this.guest.signMessage(msg);
    guestsig = guestsig.split("0x");
    guestsig = Buffer.from(guestsig[1], 'hex');      

    console.log("Guest signature created:", guestsig);

    let ret = Buffer.concat([ownersig, guestsig,
                  guestaddress], ownersig.length + 
                  guestsig.length + guestaddress.length);
    return ret;
}

LockNetwork.prototype.requestRoom = async function () {
	let bidPrice = hre.ethers.parseEther('100', 'gwei'); // bid price for room

  // Identity exists, generate proof
  let scope = this.group.root;
  let message = "hello";

  this.proof = await generateProof(this.identity, this.ownerGroup, message, scope);

  console.log("\nProof:", this.proof);
  
  await this.samplelock.connect(this.guest).
      registerGuest(this.owner, this.proof, {value: bidPrice});

	console.log("We requested room as guest");
}

LockNetwork.prototype.reqAuth = async function (nonce) {
	
	let nonce0 = Uint8Array.from(nonce.data.slice(0, 65));
	let nonce1 = Uint8Array.from(nonce.data.slice(65, 97));
	let seed = Uint8Array.from(nonce.data.slice(97, 162));
	let counter = Uint8Array.from(nonce.data.slice(162, 163));
	let hmac = Uint8Array.from(nonce.data.slice(163, 195));

	const challenge = {nonce0, nonce1, seed, counter, hmac};

  // Identity exists, generate proof
  let scope = this.group.root;
  let message = "let-me-in";

  this.proof = await generateProof(this.identity, this.ownerGroup, message, scope);

	await this.samplelock.connect(this.guest).
      reqAuth(this.owner, challenge, this.proof);
}

var locknet = new LockNetwork();

locknet.connect().catch((error) => {
  console.error(error);
  process.exitCode = 1; 
});

locknet.on('state_event', (event) => {

  state = machine.transition(state, event);
});

const machine = hsm.createMachine({
  initialState: 'idle',

  idle: {

    actions: {

      onEnter() {

        //console.log('idle: onEnter')
      },

      onExit() {

        //console.log('idle: onExit')

      },

    },

    transitions: {

      request: {

        target: 'waiting',

        action() {

          console.log('transition action for "request" in "idle" state');


        },

      },

    },

  },

  waiting: {

    actions: {

      onEnter() {

        locknet.waitChallenge();
      },

      onExit() {

        //console.log('waiting: onExit')

      },

    },

    transitions: {

      challenge: {

        target: 'response',

        action() {

          console.log('transition action for "challenge" in "waiting" state')
          locknet.solveChallenge();
        },

      },

    },

  },


  response: {

    actions: {

      onEnter() {

        console.log('challenge: onEnter')
        
      },

      onExit() {

        console.log('challenge: onExit')

      },

    },

    transitions: {

      validated: {

        target: 'response',

        action() {
          locknet.createChallenge();
        }
      },

      send: {

        target: 'ack_pending',

        action() {

          console.log('transition action for "send" in "challenge" state')
          //locknet.sendChallenge();
        },

      },

    },

  },

  ack_pending: {

    actions: {

      onEnter() {

        console.log('ack_pending: onEnter')

      },

      onExit() {

        console.log('ack_pending: onExit')

      },

    },

    transitions: {

      response: {

        target: 'ack',

        action() {

          console.log('transition action for "response" in "response_pending" state')

        },

      },

    },

  },

  ack: {

    actions: {

      onEnter() {

        //console.log('ack: onEnter')

      },

      onExit() {

        //console.log('ack: onExit')

      },

    },

    transitions: {

      done: {

        target: 'idle',

        action() {

          console.log('transition action for "done" in "ack" state')

        },

      },

    },

  }
})

let state = machine.value
