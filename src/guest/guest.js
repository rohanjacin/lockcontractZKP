const hre = require("hardhat");
const { HandshakeIntf } = require("./interface/handshake_intf.js");
var hsm = require('./interface/hsm.js');
const BN = require("bn.js");

class LockNetwork extends HandshakeIntf {
	constructor() {
		super();
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		this.guest = null;
    this.owner = null;
		console.log("Lock net init.");
		this.buildContractEventHandler();
	}
}

// Connects to the Lock contract
LockNetwork.prototype.connect = async function () {

	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.attach('0xf5059a5D33d5853360D16C683c16e67980206f36');
	
	console.log(`Attached to LockNetwork contract`);
	var deployer, owner;
	[deployer, owner, this.guest] = await hre.ethers.getSigners();
	
	this.registerEvents();
	this.requestRoom();
}

LockNetwork.prototype.registerEvents = async function () {

	filter = this.samplelock.filters.GuestApproved(this.guest, null, null);
	this.samplelock.on(filter, (result) => {

		console.log("We have been approved by owner..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Ctx:" + result.args.ctx);
		let nonce0 = result.args.ctx.nonce0;
		nonce0 = nonce0.split("0x");
		console.log("nonce0:" + nonce0);

    this.owner = result.args.owner;
    this.sendRequest(nonce0[1]);		
		return;
	});

  filter = this.samplelock.filters.RespondAuth(null, this.guest, null);
  this.samplelock.on(filter, (result) => {

    console.log("We have been approved by owner..");
    console.log("Guest:" + result.args.guest);
    console.log("Owner:" + result.args.owner);
    console.log("Owner(approved):" + this.owner);
    console.log("Ctx:" + result.args.ctx);
    let nonce = result.args.ctx.ownernonce;

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

    this.sendChallenge(respnonce);
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

LockNetwork.prototype.requestRoom = async function () {
	let bidPrice = hre.ethers.parseEther('100', 'wei'); // bid price for room

	await this.samplelock.connect(this.guest).registerGuest({value: bidPrice});

	console.log("We requested room as guest");
}

LockNetwork.prototype.reqAuth = async function (nonce) {
	
	let nonce0 = Uint8Array.from(nonce.data.slice(0, 65));
	let nonce1 = Uint8Array.from(nonce.data.slice(65, 97));
	let seed = Uint8Array.from(nonce.data.slice(97, 162));
	let counter = Uint8Array.from(nonce.data.slice(162, 163));
	let hmac = Uint8Array.from(nonce.data.slice(163, 195));

	const challenge = {nonce0, nonce1, seed, counter, hmac};

	await this.samplelock.connect(this.guest).reqAuth(challenge);
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
