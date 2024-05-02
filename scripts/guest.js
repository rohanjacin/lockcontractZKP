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
	
	//this.registerEvents();
	//this.registerRoom();
	this.requestRoom();
}

LockNetwork.prototype.registerEvents = async function () {

/*	let selfAddress = hre.ethers.getSigners();
	let filter = this.samplelock.filters.GuestRegistered(null, selfAddress[0]);
	this.samplelock.on(filter, (result) => {

		console.log("guest:" + result.args.guest);
		console.log("owner:" + result.args.owner);
		return;
	});*/

/*	filter = this.samplelock.filters.RequestAuth(this.deployedAddress, null);
	console.log("filter:" + Object.keys(filter));
	this.samplelock.on(filter, (result) => {

		console.log("From:" + result.args.from);
		console.log("To:" + result.args.to);
		console.log("Proof:" + result.args.proof);
		return;
	});*/
}

LockNetwork.prototype.requestRoom = async function () {
	let bidPrice = hre.ethers.parseEther('100', 'wei'); // bid price for room

	await this.samplelock.connect(this.guest).registerGuest({value: bidPrice});

	console.log("We requested room as guest");
}

var locknet = new LockNetwork();

locknet.connect().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
