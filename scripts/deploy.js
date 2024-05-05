const hre = require("hardhat");

class LockNetwork {
	constructor() {
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;

		this.auction = null;
		this.Auction = null;
		this.auctionAddress = null;

		this.ownerverifier = null;
		this.OwnerVerifier = null;
		this.ownerverifierAddress = null;

		this.guestverifier = null;
		this.GuestVerifier = null;
		this.guestverifierAddress = null;

		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.deploy = async function () {

	this.Auction = await hre.ethers.getContractFactory('Auction');
	this.auction = await this.Auction.deploy();
	await this.auction.waitForDeployment();
	this.auctionAddress = await this.auction.getAddress(); 

	this.OwnerVerifier = await hre.ethers.getContractFactory('Groth16Verifier');
	this.ownerverifier = await this.OwnerVerifier.deploy();
	await this.ownerverifier.waitForDeployment();
	this.ownerverifierAddress = await this.ownerverifier.getAddress(); 

	this.GuestVerifier = await hre.ethers.getContractFactory('GuestVerifier');
	this.guestverifier = await this.GuestVerifier.deploy();
	await this.guestverifier.waitForDeployment();
	this.guestverifierAddress = await this.guestverifier.getAddress(); 


	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.deploy('samplelock', this.auctionAddress,
											  this.ownerverifierAddress,
											  this.guestverifierAddress);
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

	filter = this.samplelock.filters.RespondAuth(null, null, null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Guest have been approved by owner..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Owner verified?:" + result.args.isOwnerVerfied);
		console.log("Ctx:" + result.args.ctx);
		return;
	});			
}

var locknet = new LockNetwork();

locknet.deploy().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
