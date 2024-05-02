const hre = require("hardhat");

class LockNetwork {
	constructor() {
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		this.owner = null;
		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.connect = async function () {

	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.attach('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
	console.log(`Attached to LockNetwork contract`);
	var deployer;
	[deployer, this.owner] = await hre.ethers.getSigners();

	this.registerEvents();
	this.registerRoom();
}

LockNetwork.prototype.registerEvents = async function () {

	let filter = this.samplelock.filters.GuestRegistered(null, this.owner);
	this.samplelock.on(filter, (result) => {

		console.log("guest:" + result.args.guest);
		console.log("owner:" + result.args.owner);

		this.approveGuest(result.args.guest);
		return;
	});

/*	filter = this.samplelock.filters.RequestAuth(this.deployedAddress, null);
	console.log("filter:" + Object.keys(filter));
	this.samplelock.on(filter, (result) => {

		console.log("From:" + result.args.from);
		console.log("To:" + result.args.to);
		console.log("Proof:" + result.args.proof);
		return;
	});*/
}

LockNetwork.prototype.registerRoom = async function () {
	let basePrice = 100; // base price for room
	let ipfsHash = "dummy"; // connect to off-chain db later

	await this.samplelock.connect(this.owner).registerOwner(basePrice, ipfsHash);
	console.log("We registered room as owner");
}

LockNetwork.prototype.approveGuest = async function (guest) {

	await this.samplelock.connect(this.owner).approveGuest(guest);
	console.log("We approved the guest");
}


var locknet = new LockNetwork();

locknet.connect().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
