//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import { Auction } from './auction.sol';

/** The Lock contract does the following
 *  1. Registers a Owner; opens up for bidding of the room
 *  2. The winning bidder gets becomes a guest.  
 *  3. The guest request's for authentication with a designated lock (booked room)
 * 	   while in vicinty to the lock. 
 *  4. 
*/
    

contract LockZKP {

	string name;
    address public owner;
    bool public ownerRegistered;
	uint constant BID_INCREMENT = 10;
	Auction auction;

	// Session context for guest's
	struct GuestSession {
		uint16 counter; // same random counter
		uint256 nonce; // epherium public key 
		uint256 id; // guest identification
		GuestProof gproof;
	}

	// Guest validation proof
	struct GuestProof {
		uint256 p; // guest proof of private key
		uint256 ts; // timestamp
	}

	constructor (string memory _name) {
		name = _name;
		console.log("Lock Contract created.. name:%s ", string(name));
	}

	// Map the guest's with their sessions context
	mapping (address => GuestSession) public guestSessions;

	// When guest request for authorization with the lock
	event RequestAuth (address indexed from, address indexed to, GuestSession ctx);

	// When owner request's for bidding of the room	
	event BidRoom (address indexed from, uint256 price);

	// Register an Owner for the property
	function registerOwner (address _owner, uint _basePrice, string memory _ipfsHash)
		public onlyNoOwnerRegistered {
		
		owner = _owner;
		ownerRegistered = true;

		// Set the auction params
		auction = new Auction(_owner, BID_INCREMENT, _basePrice,
							  block.number + 1, block.number + 11, _ipfsHash);

		// Send out an event to all participants indicating start of bidding
		emit BidRoom (_owner, _basePrice);
	}

	// Guest requesting authenication on arrival
	function reqAuth (GuestProof memory _proof) public onlyNotOwner onlyValidGuest {

		// Validate guest proof here
		// If valid guest 
		console.log("Registering Auth from guest");
		emit RequestAuth (msg.sender, owner, guestSessions[msg.sender]);
	}

	// Register potential guest
	function registerGuest ()
		public onlyNotOwner onlyAfterOwnerRegistered
		returns (bool success) {
		GuestSession memory pg;
		address _guest;
		uint _finalPrice;

		auction.placeBid();

		// Only accept the first guest currently.
		auction.cancelAuction();

		(_guest, _finalPrice) = auction.getHighestBidAndBidder();

		console.log("Final Price:", _finalPrice);

		// Add guest to the list
		if (_guest == address(msg.sender)) {
			// counter value the guest needs to enter on the lock keypad
			// nonce will be populated when the guest arrives in vicintiy of the lock
			pg.counter = 1234;
			pg.id = 1;
			guestSessions[msg.sender] = pg;

			return true;
		}
		else {
			return false;
		}
	}

    modifier onlyNotOwner {
        if (msg.sender == owner) revert();
        _;
    }

	modifier onlyAfterOwnerRegistered {
		if (!ownerRegistered) revert();
		_;
	}

	modifier onlyNoOwnerRegistered {
		if (ownerRegistered) revert();
		_;
	}

    modifier onlyValidGuest {
        if (guestSessions[msg.sender].id == 0) revert();
        _;
    }	
}