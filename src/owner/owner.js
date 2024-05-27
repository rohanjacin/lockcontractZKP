const hre = require("hardhat");
var hsm = require('./hsm.js');
var utils = require('./utils.js');
const BN = require("bn.js");
const { ServerHandshake } = require("./server_handshake.js");
const { LockProver } = require("./prover.js");
const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const { generateProof } = require("@semaphore-protocol/proof");

class LockNetwork extends ServerHandshake {
	constructor() {
		super();
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		this.owner = null;
    this.guest = null;
    this.guests = [];
    this.timer = null;
    this.lockprover = new LockProver();
    this.proof = null;
    this.ownerGroup = null;
    this.group = null;
    this.identity = null;
    this.bidTimer = null;
    this.bidCountSecs = 10000;


    this.buildContractEventHandler();

    // Using Semaphore-protocol for identity 
    // proofs for group membership (so that family
    // members can skip placing a bid for the room)
    let createMembership = async function () {

      const _secret = process.env.SECRET;
      // Create identities for family members
      const identity1 = new Identity("self"+_secret);
      const identity2 = new Identity("spouse"+_secret);
      const identity3 = new Identity("kid"+_secret);

      const members = [identity1.commitment, identity2.commitment,
                       identity3.commitment];
      this.identity = identity1;
      this.ownerGroup = new Group(members);
      console.log("Group(exported json):" + this.ownerGroup.export());

      let member = [this.ownerGroup.members[0], this.ownerGroup.members[1],
                    this.ownerGroup.members[2]];
      let root = this.ownerGroup.root;
      this.group = {member, root};

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
	let _owners = await hre.ethers.getSigners();
  this.owner = _owners[process.env.SIGNER_INDEX];

	this.registerEvents();
	await this.registerRoom();
}

// Registers for event from the lock handshake interface which
// communicates with the Lock handshake protocol
LockNetwork.prototype.buildContractEventHandler = async function () {
  this.on('contract_event', function (event, data) {

    if (event == 'response') {
      console.log("Sending the challenge (response)");
      this.responseAuth(this.guest, data);
    }       
  }.bind(this));
}

LockNetwork.prototype.registerEvents = async function () {

	// When guest is registered
	filter = this.samplelock.filters.GuestRegistered(null, this.owner);
	this.samplelock.on(filter, (result) => {

		console.log("guest:" + result.args.guest);
		console.log("owner:" + result.args.owner);
    console.log("bid:" + result.args.bid);
    console.log("groupRoot:" + result.args.groupRoot);

    let _groupRoot = result.args.groupRoot;
    let _bid = result.args.bid;
    let _guest = result.args.guest;

    // If the guest is not a group member
    if (!_groupRoot) {
      // Add guests to the list
      this.guests.push({address: _guest, bid: _bid});

      // Allow for other guests to bid
      if (!this.bidTimer) {
          this.bidTimer = setInterval(() => {

            this.bidCountSecs--; 

            if (this.bidCountSecs < 0) {

              this.guest = utils.highestBiddingGuest(this.guests);
              clearInterval(this.bidTimer);

              console.log("this.guest:" + this.guest);
              this.approveGuest(this.guest);
            }
          });
      }
    }
		return;
	});

	// When guest request authentication
	filter = this.samplelock.filters.RequestAuth(null, this.owner, null);
	this.samplelock.on(filter, (result) => {

    console.log("Event for request authentication:" + state);
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Lock Nonce:" + result.args.nonce);

    this.guest = result.args.guest;

    let locknonce = result.args.nonce;
    let nonce0 = locknonce[0].split("0x");
    let nonce1 = locknonce[1].split("0x");
    let seed = locknonce[2].split("0x");
    let counter = locknonce[3].split("0x");
    let hmac = locknonce[4].split("0x");

    nonce0 = new BN(nonce0[1], 16).toBuffer(65);
    nonce1 = new BN(nonce1[1], 16).toBuffer(32);
    seed = new BN(seed[1], 16).toBuffer(65);
    counter = new BN(counter[1], 16).toBuffer(1);
    hmac = new BN(hmac[1], 16).toBuffer(32);

    let lock_nounce = Buffer.concat([nonce0, nonce1, seed, counter, hmac],
                                    nonce0.length + nonce1.length + seed.length + 
                                    counter.length + hmac.length);

    console.log("lock_nounce:" + JSON.stringify(lock_nounce));
    console.log("lock_nounce(keys):" + Object.keys(lock_nounce));

    this.lock_nounce = lock_nounce;
    
    // Post event challenge to State machine
    this.postEvent('challenge');
		return;
	});
}

// Registers the room starts opens the bidding process
LockNetwork.prototype.registerRoom = async function () {
	let basePrice = 100; // base price for room
	let ipfsHash = "dummy"; // connect to off-chain db later

  let message = "hello";
  let scope = this.ownerGroup.root;
  this.proof = await generateProof(this.identity, this.ownerGroup,
                                   message, scope);

  console.log("\nPROOF:", this.proof);
	await this.samplelock.connect(this.owner).registerOwner(basePrice,
              ipfsHash, this.group.root, this.proof);

	console.log("We registered room as owner:");
}

// Approves the guest with the winning bid
LockNetwork.prototype.approveGuest = async function (guest) {

	let {type, nonce} = await this.sendRequest();
	console.log("type:" + type);
	console.log("nonce:" + nonce.toString());
	nonce = Uint8Array.from(nonce.slice(0, 65));

	await this.samplelock.connect(this.owner).approveGuest(guest, nonce);
	console.log("We approved the guest");
}

// Respond to Auth with challenge to the guest/lock
LockNetwork.prototype.responseAuth = async function (guest, nonce) {

  let nonce0 = Uint8Array.from(nonce.slice(0, 65));
  let nonce1 = Uint8Array.from(nonce.slice(65, 97));
  let seed = Uint8Array.from(nonce.slice(97, 162));
  let counter = Uint8Array.from(nonce.slice(162, 163));
  let hmac = Uint8Array.from(nonce.slice(163, 195));

  const response = {nonce0, nonce1, seed, counter, hmac};
  console.log("Response:" + JSON.stringify(response));

  this.lockprover.update();
  let { proof, publicSignals } = await this.lockprover.prove();

  await this.samplelock.connect(this.owner).responseAuth(guest,
                                response, proof[0], proof[1], proof[2],
                                publicSignals);
  console.log("We responded to the auth");
}


var locknet = new LockNetwork();


locknet.on('state_event', (event) => {

  state = machine.transition(state, event);
});

locknet.connect().catch((error) => {
  console.error(error);
  process.exitCode = 1; 
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
          locknet.sendChallenge();
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
let state = machine.value;
