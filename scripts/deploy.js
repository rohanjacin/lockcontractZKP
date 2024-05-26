const hre = require("hardhat");

// Interface to the Lock network
class LockNetwork {
	constructor() {
		// Lock contract objects
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;

		// Auction library
		this.auction = null;
		this.Auction = null;
		this.auctionAddress = null;

		// Owner proof verifier objects
		this.ownerverifier = null;
		this.OwnerVerifier = null;
		this.ownerverifierAddress = null;

		// Group proof verifier objects
		this.groupverifier = null;
		this.GroupVerifier = null;
		this.groupverifierAddress = null;

		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.deploy = async function () {

	// Deploys Auction library
	this.Auction = await hre.ethers.getContractFactory('Auction');
	this.auction = await this.Auction.deploy();
	await this.auction.waitForDeployment();
	let _auctionAddress = this.auctionAddress = await this.auction.getAddress();

	// Deploys owner proof verifier contract
	this.OwnerVerifier = await hre.ethers.getContractFactory('Groth16Verifier');
	this.ownerverifier = await this.OwnerVerifier.deploy();
	await this.ownerverifier.waitForDeployment();
	this.ownerverifierAddress = await this.ownerverifier.getAddress(); 

	// Deploys guest proof verifier contract
	// SemaphoreVerifier.sol from @semaphore-protocol/contracts
	this.GroupVerifier = await hre.ethers.getContractFactory('SemaphoreVerifier');
	this.groupverifier = await this.GroupVerifier.deploy();
	await this.groupverifier.waitForDeployment();
	this.groupverifierAddress = await this.groupverifier.getAddress(); 

	// Deploys lock contract
	this.Lock = await hre.ethers.getContractFactory('LockZKP', {
		libraries: {
			Auction: _auctionAddress
		}
	});
	this.samplelock = await this.Lock.deploy('samplelock', this.ownerverifierAddress,
											  this.groupverifierAddress);
	await this.samplelock.waitForDeployment();
	this.deployedAddress = await this.samplelock.getAddress(); 
	console.log(`Deployed to ${this.deployedAddress}`);
	
	//console.log("this.samplelock:",Object.keys(this.samplelock.runner.provider._hardhatProvider._emitter._events));
	//Object.keys(this.owner.provider._hardhatProvider._emitter._events)
	// Register for events from Owner, Guest, network.
	this.registerEvents();
}

LockNetwork.prototype.registerEvents = async function () {

	// Bidding open after Owner registers
	let filter = this.samplelock.filters.BidRoomNow(null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Onwer has registered..");
		console.log("Onwer:" + result.args.owner);
		console.log("Price:" + result.args.price);
		return;
	});

	// Guest registers after after winning bid
	filter = this.samplelock.filters.GuestRegistered(null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Guest has registered and bid..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		return;
	});

	// Guest approved by owner
	filter = this.samplelock.filters.GuestApproved(null, null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Guest has been approved by owner..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Nonce:" + result.args.nonce);
		return;
	});

	filter = this.samplelock.filters.RespondAuth(null, null, null, null);
	this.samplelock.on(filter, (result) => {

		console.log("Guest have been approved by owner..");
		console.log("Guest:" + result.args.guest);
		console.log("Owner:" + result.args.owner);
		console.log("Owner verified?:" + result.args.isOwnerVerfied);
		console.log("Nonce:" + result.args.nonce);
		return;
	});			
}

var locknet = new LockNetwork();

locknet.deploy().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
