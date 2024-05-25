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

// Nonce structure (https://drive.google.com/file/d/1lza0qvFcVXlVRDdPPlYLRkMz2nAFCdVS/view?usp=sharing)
struct LockNonce {
	bytes nonce0; //65
	bytes nonce1; //32
	bytes seed; //65
	bytes counter; //1
	bytes hmac; //32
}

/// It defines all the Semaphore proof parameters used by Semaphore.sol.
struct SemaphoreProof {
    uint256 merkleTreeDepth;
    uint256 merkleTreeRoot;
    uint256 nullifier;
    uint256 message;
    uint256 scope;
    uint256[8] points;
}

struct Group {
	uint256[3] member;
	uint256 root;
}

// Interface to verifier.sol (Owner verification)
interface IGroth16Verifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB,
    uint[2] calldata _pC, uint[16] calldata _pubSignals) external view returns (bool);
}

// Interface to SemaphoreVerifier.sol (Guest/Owner verification)
interface ISemaphoreVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB,
    uint[2] calldata _pC, uint[4] calldata _pubSignals, 
    uint merkleTreeDepth) external view returns (bool);
}

contract LockZKP {

    // static
    address public owner;
    Group public ownerGroup;
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
	// Auction contract address
	address auction;
	// Owner verifier contract address
	address ownerverifier;
	// Guest/Owner group verifier contract address
    address public groupverifier;

    bool public ownerRegistered;
	uint constant BID_INCREMENT = 10;

	//Auction auction;

	// Session context for guest's
	struct GuestSession {
		uint16 counter; // same random counter
		bytes nonce0; // epherium public key (65 bytes) 
		uint256 id; // guest identification
		uint256 groupRoot; // group id
		uint256 price; // guest identification
		LockNonce locknonce; // lock challenge
		LockNonce ownernonce; // owner challenge
		GuestProof gproof;
	}

	// Guest validation proof
	struct GuestProof {
		uint256 p; // guest proof of private key
		uint256 ts; // timestamp
	}

	constructor (string memory _name, address _auction, 
				 address _ownerverifier, address _groupverifier) {
		name = _name;
		auction = _auction;
		ownerverifier = _ownerverifier;
		groupverifier = _groupverifier;
		console.log("Lock Contract created.. name:%s ", string(name));
	}

	// Map the guest's with their sessions context
	mapping (address => GuestSession) public guestSessions;

	// When guest request for authorization with the lock
	event RequestAuth (address indexed guest, address indexed owner, GuestSession ctx);

	// When owner responds to authorization with the lock
	event RespondAuth (address indexed owner, address indexed guest,
					   GuestSession ctx, bool isOwnerVerfied);

	// When owner request's for bidding of the room	
	event BidRoomNow (address indexed owner, uint256 price);

	// When guest registers and wins bid
	event GuestRegistered (address indexed guest, address indexed owner);

	// When guest is approved
	event GuestApproved (address indexed guest, address indexed owner, GuestSession ctx);

	// Register an Owner for the property
	function registerOwner (uint _basePrice, string memory _ipfsHash,
							Group calldata _group, SemaphoreProof calldata proof)
		public onlyNoOwnerRegistered {
		
		// Validate owner proof here (from Semaphore.sol @semaphore-protocol/contracts)
        bool result = ISemaphoreVerifier(groupverifier).verifyProof(
            [proof.points[0], proof.points[1]],
            [[proof.points[2], proof.points[3]], [proof.points[4], proof.points[5]]],
            [proof.points[6], proof.points[7]],
            [proof.merkleTreeRoot, proof.nullifier, _hash(proof.message), _hash(proof.scope)],
            proof.merkleTreeDepth
        );

        require(result);

		owner = msg.sender;
		ownerRegistered = true;
		ownerGroup = _group;

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
	function approveGuest (address _guest, bytes memory nonce0)
		public onlyOwner onlyAfterOwnerRegistered {
		
		address _highestBidder;
		uint _bidPrice;
		GuestSession memory gCtx;

		console.log("Guest is:", _guest);
		
		gCtx = guestSessions[_guest];

		// If Owner's guest is part of the owner's group
		// skip the auction process
		if (gCtx.groupRoot != ownerGroup.root) {

			// Only accept the first guest currently, then cancel auction
			(bool success2, bytes memory data2) = auction.delegatecall(
						abi.encodeWithSelector(Auction.cancelAuction.selector));

			// Get the guest's bid
			(bool success3, bytes memory data3) = auction.delegatecall(
						abi.encodeWithSelector(Auction.getHighestBidAndBidder.selector));

			(_highestBidder, _bidPrice) = abi.decode(data3, (address, uint));

			console.log("Highest Bidder is:", _highestBidder);
			console.log("Bid Price:", _bidPrice);

			// Add guest to the list
			if (_guest == _highestBidder) {
				// counter value the guest needs to enter on the lock keypad
				// nonce will be populated when the guest arrives in vicintiy of the lock
				gCtx.counter = 1234;
				gCtx.id = 1;
				gCtx.price = _bidPrice;
				gCtx.nonce0 = nonce0;
				guestSessions[_guest] = gCtx;

				emit GuestApproved (_guest, owner, gCtx);
			}
		}
		else {
			gCtx.counter = 1234;
			gCtx.id = 1;
			gCtx.nonce0 = nonce0;
			guestSessions[_guest] = gCtx;
			emit GuestApproved (_guest, owner, gCtx);
		}
	}

	// Guest requesting authenication on arrival
	function reqAuth (LockNonce memory _nonce, Group calldata _group,
					  SemaphoreProof calldata proof)
		public onlyNotOwner onlyValidGuest {
		address _guest = msg.sender;
		GuestSession memory gCtx = guestSessions[_guest];

		// If this guest is part of the owner's group validate its proof
        if ((proof.merkleTreeRoot == ownerGroup.root) && 
            (gCtx.groupRoot == ownerGroup.root)) {

			// Validate guest proof here (from Semaphore.sol @semaphore-protocol/contracts)
	        bool result = ISemaphoreVerifier(groupverifier).verifyProof(
	            [proof.points[0], proof.points[1]],
	            [[proof.points[2], proof.points[3]], [proof.points[4], proof.points[5]]],
	            [proof.points[6], proof.points[7]],
	            [proof.merkleTreeRoot, proof.nullifier, _hash(proof.message), _hash(proof.scope)],
	            proof.merkleTreeDepth
	        );

			console.log("Proof verifier(guest):", result);
			require(result);

			console.log("Registering Auth from guest");
			gCtx.locknonce = _nonce;
			emit RequestAuth (_guest, owner, gCtx);

		}
		else if (_guest == highestBidder) {
			
			gCtx.locknonce = _nonce;
			console.log("Registering Auth from guest");
			emit RequestAuth (_guest, owner, gCtx);
		}
	}

	// Owner's response to authenication
	function responseAuth (/*GuestProof memory _proof, */address _guest,
						   LockNonce memory _nonce,  uint[2] calldata _proof0,
						   uint[2][2] calldata _proof1, uint[2] calldata _proof2,
							uint[16] calldata  _publicSignals)
		public onlyOwner onlyAfterOwnerRegistered {
		// Validate owner's proof here

		bool result = IGroth16Verifier(ownerverifier).verifyProof(
			_proof0, _proof1, _proof2, _publicSignals);
		//bool result = true;
		console.log("Proof verifier(owner):", result);
		require(result);

		// If valid owner forward the nonce (challenge) to lock
		GuestSession memory gCtx;
		gCtx = guestSessions[_guest];
		gCtx.ownernonce = _nonce; 						 
		console.log("Responding to Auth from guest");
		emit RespondAuth (owner, _guest, gCtx, result);
	}

	// Register potential guest
	//onlyNotOwner onlyAfterOwnerRegistered
	function registerGuest (Group calldata _group, SemaphoreProof calldata proof)
		public payable 
		returns (bool success) {
		address _guest;
		uint _finalPrice;
		GuestSession memory gCtx;

		console.log("in registerGuest");

		// If this guest is part of the owner's group
		// skip the auction process
        if (proof.merkleTreeRoot == ownerGroup.root) {
			// Validate owner proof here (from Semaphore.sol @semaphore-protocol/contracts)
	        bool result = ISemaphoreVerifier(groupverifier).verifyProof(
	            [proof.points[0], proof.points[1]],
	            [[proof.points[2], proof.points[3]], [proof.points[4], proof.points[5]]],
	            [proof.points[6], proof.points[7]],
	            [proof.merkleTreeRoot, proof.nullifier, _hash(proof.message), _hash(proof.scope)],
	            proof.merkleTreeDepth
	        );

	        console.log("result:", result);
	        require(result);

	        gCtx.groupRoot = ownerGroup.root;
        	console.log("Registering owner's guest..:", msg.value);
        }
        else {
        	gCtx.groupRoot = 0;
			console.log("Registering guest..:", msg.value);
			(bool success1, bytes memory data1) = auction.delegatecall(
						abi.encodeWithSelector(Auction.placeBid.selector));
        }

        _guest = msg.sender; 
		guestSessions[_guest] = gCtx;
		console.log("out register guest");
		emit GuestRegistered (_guest, owner);
		
		return (true);
	}

    // @dev Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
    // @param message: Message to be hashed.
    // @return Message digest.
    // (from Semaphore.sol @semaphore-protocol/contracts)
    function _hash(uint256 message) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(message))) >> 8;
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