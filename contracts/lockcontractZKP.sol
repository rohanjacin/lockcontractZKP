pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract LockZKP {

	// Session context for potential guest's
	struct PGuestSession {
		uint16 counter; // random counter
		uint256 nonce; // cipher 1 (owner)
	}

	// Session context for validated guest's
	struct VGuestSession {
		uint16 counter; // same random counter during auth phase 
		uint256 id; // guest identification
	}

	// Session context for potential guest's
	struct GuestProof {
		uint256 proof; // guest proof of private key
		uint256 ts; // timestamp
	}

	constructor (string memory _name) {
		name = _name;
		console.log("Lock Contract created:", name);
	}

	// Map the potential guest's with their sessions context
	mapping (address => PGuestSession) PG_sessions;

	// Map the validated guest's with their sessions context
	mapping (address => VGuestSession) VG_sessions;

	// Guest requesting authenication on arrival
	function reqAuth (GuestProof gproof) public {
		// Validate guest proof
	} 
}