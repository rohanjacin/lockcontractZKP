const hre = require("hardhat");

class LockNetwork {
	constructor() {
		this.samplelock = null;
		this.Lock = null;
		this.deployedAddress = null;
		console.log("Lock net init.");
	}
}

// Connects to the Lock contract
LockNetwork.prototype.connect = async function () {

	this.Lock = await hre.ethers.getContractFactory('LockZKP');
	this.samplelock = await this.Lock.deploy('samplelock');
	await this.samplelock.waitForDeployment();
	this.deployedAddress = await this.samplelock.getAddress(); 
	console.log(`Deployed to ${this.deployedAddress}`);
	
	this.registerEvents();

	this.reqAuth();
}

LockNetwork.prototype.registerEvents = async function () {

	let filter = this.samplelock.filters.RequestAuth(this.deployedAddress, null);
	console.log("filter:" + Object.keys(filter));
	this.samplelock.on(filter, (result) => {

		console.log("From:" + result.args.from);
		console.log("To:" + result.args.to);
		console.log("Proof:" + result.args.proof);
		return;
	});
}

LockNetwork.prototype.reqAuth = async function () {
	await this.samplelock.reqAuth();
}

var locknet = new LockNetwork();

locknet.connect().catch((error) => {
	console.error(error);
	process.exitCode = 1;	
});
