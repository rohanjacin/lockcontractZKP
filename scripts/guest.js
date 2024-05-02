const hre = require("hardhat");

class LockNetwork {
	constructor() {
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		this.guest = null;
		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.connect = async function () {

	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.attach('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
	
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

		this.reqAuth();
		return;
	});	
}

LockNetwork.prototype.requestRoom = async function () {
	let bidPrice = hre.ethers.parseEther('100', 'wei'); // bid price for room

	await this.samplelock.connect(this.guest).registerGuest({value: bidPrice});

	console.log("We requested room as guest");
}

LockNetwork.prototype.reqAuth = async function () {
	await this.samplelock.connect(this.guest).reqAuth();
}

var locknet = new LockNetwork();

locknet.connect().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
