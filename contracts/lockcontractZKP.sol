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

    // static
    address public owner;
    uint public bidIncrement;
    uint public startBlock;
    uint public endBlock;
    string public ipfsHash;

    // state
    bool public canceled;
    uint public highestBindingBid;
    address public highestBidder;
    mapping(address => uint256) public fundsByBidder;
    bool ownerHasWithdrawn;

	string name;
	address auction;
    bool public ownerRegistered;
	uint constant BID_INCREMENT = 10;

	//Auction auction;

	// Session context for guest's
	struct GuestSession {
		uint16 counter; // same random counter
		uint256 nonce; // epherium public key 
		uint256 id; // guest identification
		uint256 price; // guest identification
		GuestProof gproof;
	}

	// Guest validation proof
	struct GuestProof {
		uint256 p; // guest proof of private key
		uint256 ts; // timestamp
	}

	constructor (string memory _name, address _auction) {
		name = _name;
		auction = _auction;
		console.log("Lock Contract created.. name:%s ", string(name));
	}

	// Map the guest's with their sessions context
	mapping (address => GuestSession) public guestSessions;

	// When guest request for authorization with the lock
	event RequestAuth (address indexed from, address indexed to, GuestSession ctx);

	// When owner request's for bidding of the room	
	event BidRoomNow (address indexed owner, uint256 price);

	// When guest registers and wins bid
	event GuestRegistered (address indexed guest, address indexed owner);

	// When guest is approved
	event GuestApproved (address indexed guest, address indexed owner, GuestSession ctx);

	// Register an Owner for the property
	function registerOwner (uint _basePrice, string memory _ipfsHash)
		public onlyNoOwnerRegistered {
		
		owner = msg.sender;
		ownerRegistered = true;

		console.log("Registering owner..");

		// Start the auction
		(bool success, bytes memory data) = auction.delegatecall(
			abi.encodeWithSelector(Auction.start.selector, 
				owner, BID_INCREMENT, _basePrice, block.number + 1,
				block.number + 10, _ipfsHash));			

		console.log("Auction started..");

		console.log("owner:", owner);
		console.log("bidIncrement:", bidIncrement);
		console.log("startBlock:", startBlock);
		console.log("endBlock:", endBlock);
		console.log("ipfsHash:", ipfsHash);

		// Send out an event to all participants indicating start of bidding
		emit BidRoomNow (owner, _basePrice);
	}

	// Owner wants to approve the guest
	function approveGuest (address _guest)
		public onlyOwner onlyAfterOwnerRegistered {
		
		address _highestBidder;
		uint _bidPrice;
		GuestSession memory gCtx;

		// Only accept the first guest currently, then cancel auction
		(bool success2, bytes memory data2) = auction.delegatecall(
					abi.encodeWithSelector(Auction.cancelAuction.selector));

		// Get the guest's bid
		(bool success3, bytes memory data3) = auction.delegatecall(
					abi.encodeWithSelector(Auction.getHighestBidAndBidder.selector));

		(_highestBidder, _bidPrice) = abi.decode(data3, (address, uint));

		console.log("Guest is:", _guest);
		console.log("Highest Bidder is:", _highestBidder);
		console.log("Bid Price:", _bidPrice);

		// Add guest to the list
		if (_guest == _highestBidder) {
			// counter value the guest needs to enter on the lock keypad
			// nonce will be populated when the guest arrives in vicintiy of the lock
			gCtx.counter = 1234;
			gCtx.id = 1;
			gCtx.price = _bidPrice;
			guestSessions[_guest] = gCtx;

			emit GuestApproved (_guest, owner, gCtx);
		}
	}

	// Guest requesting authenication on arrival
	function reqAuth (GuestProof memory _proof) public onlyNotOwner onlyValidGuest {

		// Validate guest proof here
		// If valid guest 
		console.log("Registering Auth from guest");
		emit RequestAuth (msg.sender, owner, guestSessions[msg.sender]);
	}

	// Register potential guest
	//onlyNotOwner onlyAfterOwnerRegistered
	function registerGuest ()
		public payable 
		returns (bool success) {
		address _guest;
		uint _finalPrice;

		console.log("Registering guest..:", msg.value);

		(bool success1, bytes memory data1) = auction.delegatecall(
					abi.encodeWithSelector(Auction.placeBid.selector));

		emit GuestRegistered (msg.sender, owner);
	}

    modifier onlyOwner {
        if (msg.sender != owner) revert();
        _;
    }

    modifier onlyNotOwner {
        if (msg.sender == owner) revert();
        _;
    }

	modifier onlyAfterOwnerRegistered {
		if (!ownerRegistered) revert("Owner not registered");
		_;
	}

	modifier onlyNoOwnerRegistered {
		if (ownerRegistered) revert("Owner already registered");
		_;
	}

    modifier onlyValidGuest {
        if (guestSessions[msg.sender].id == 0) revert("Guest session doesnt exists");
        _;
    }	
}