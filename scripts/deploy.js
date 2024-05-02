const hre = require("hardhat");

class LockNetwork {
	constructor() {
		this.samplelock = null;
		this.Lock = null;
		this.auction = null;
		this.Auction = null;
		this.deployedAddress = null;
		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.deploy = async function () {

	this.Auction = await hre.ethers.getContractFactory('Auction');
	this.auction = await this.Auction.deploy();
	await this.auction.waitForDeployment();
	this.deployedAddress = await this.auction.getAddress(); 

	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.deploy('samplelock', this.deployedAddress);
	await this.samplelock.waitForDeployment();
	this.deployedAddress = await this.samplelock.getAddress(); 
	console.log(`Deployed to ${this.deployedAddress}`);

	
	this.registerEvents();
}

LockNetwork.prototype.registerEvents = async function () {

	let filter = this.samplelock.filters.BidRoomNow(null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Onwer has registered..");
		console.log("Onwer:" + result.args.owner);
		console.log("Price:" + result.args.price);
		return;
	});

	filter = this.samplelock.filters.GuestRegistered(null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Guest has registered and bid..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		return;
	});

	filter = this.samplelock.filters.GuestApproved(null, null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Guest has been approved by owner..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Ctx:" + result.args.ctx);
		return;
	});		
}

var locknet = new LockNetwork();

locknet.deploy().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
