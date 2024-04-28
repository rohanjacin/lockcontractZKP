//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

/** The Lock contract does the following
 *  1. Allows a guest to request for authentication with a lock in vicinity
 * 	   a. If the guest has booked the room in advance with the owner.
 *
 * 	2. 
*/
contract LockZKP {

	string name;

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
		uint256 p; // guest proof of private key
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

	event RequestAuth (address indexed from, address indexed to, uint256 proof);

	// Guest requesting authenication on arrival
	function reqAuth () public {
		// Validate guest proof
		GuestProof memory gproof;
		gproof.p = 1;
		gproof.ts = 2;

		console.log("Registering Auth from guest");
		emit RequestAuth(address(this), msg.sender, 12);
	} 
}