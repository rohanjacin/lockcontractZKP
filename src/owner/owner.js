const hre = require("hardhat");
const { ServerHandshake } = require("./server_handshake.js");
var hsm = require('./hsm.js');
const BN = require("bn.js");

class LockNetwork extends ServerHandshake {
	constructor() {
		super();
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		this.owner = null;
    this.guest = null;
    this.buildContractEventHandler();
		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.connect = async function () {

	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.attach('0xf5059a5D33d5853360D16C683c16e67980206f36');
	console.log(`Attached to LockNetwork contract`);
	var deployer;
	[deployer, this.owner] = await hre.ethers.getSigners();

	this.registerEvents();
	this.registerRoom();
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
	let filter = this.samplelock.filters.GuestRegistered(null, this.owner);
	this.samplelock.on(filter, (result) => {

		console.log("guest:" + result.args.guest);
		console.log("owner:" + result.args.owner);

		this.approveGuest(result.args.guest);
		return;
	});

	// When guest request authentication
	filter = this.samplelock.filters.RequestAuth(null, this.owner, null);
	console.log("filter:" + Object.keys(filter));
	this.samplelock.on(filter, (result) => {

    console.log("Event for request authentication:" + state);
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Ctx:" + result.args.ctx);
		console.log("Lock Nonce:" + result.args.ctx.locknonce);

    this.guest = result.args.guest;

    let locknonce = result.args.ctx.locknonce;
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

	await this.samplelock.connect(this.owner).registerOwner(basePrice, ipfsHash);
	console.log("We registered room as owner");
}

// Approves the guest with the winning bid
LockNetwork.prototype.approveGuest = async function (guest) {

	let {type, nonce0} = await this.sendRequest();
	console.log("type:" + type);
	console.log("nonce0:" + nonce0.toString());
	nonce0 = Uint8Array.from(nonce0.slice(0, 65));

	await this.samplelock.connect(this.owner).approveGuest(guest, nonce0);
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

  await this.samplelock.connect(this.owner).responseAuth(guest, response);
  console.log("We responded to the auth");
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