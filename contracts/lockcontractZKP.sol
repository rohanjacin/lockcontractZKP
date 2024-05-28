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

// Session context for guests
struct GuestSession {
	uint256 id; // guest identification
	uint256 counter; // random counter
	uint256 price; // bid
	uint256 groupRoot; // group id
	address owner; // owner
	//bytes nonce; // epherium public key (65 bytes) 
}

// Session context for owners
struct OwnerSession {
	bool registered; // registration status
	uint256 id; // owner identification
	uint256 counter; // random counter
	uint256 basePrice; // bid
	uint256 groupRoot; // group id 		
	//bytes nonce; // epherium public key (65 bytes) 
}

// Interface to auction.sol (the auction process for each owner)
/*interface IAuction {
    function start (address _owner, uint _bidIncrement, uint _highestBindingBid,
	uint _startBlock, uint _endBlock) external returns (bool);

    function cancelAuction() external onlyOwner onlyBeforeEnd
    onlyNotCanceled returns (bool success);

    function placeBid() external payable onlyAfterStart onlyBeforeEnd
    onlyNotCanceled onlyNotOwner returns (bool success);

    function getHighestBidAndBidder() external
    view returns (address, uint);    	
}*/

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

	string name;
	// Owner verifier contract address
	address ownerverifier;
	// Guest/Owner group verifier contract address
    address public groupverifier;

    bool public ownerRegistered;
	uint constant BID_INCREMENT = 10;

	constructor (string memory _name,  address _ownerverifier,
				 address _groupverifier) {
		name = _name;
		ownerverifier = _ownerverifier;
		groupverifier = _groupverifier;
		//console.log("Lock Contract created.. name:%s ", string(name));
	}

	// Map the owners's with their sessions context
	mapping (address => OwnerSession) public ownerSessions;

	// Map the guest's with their sessions context
	mapping (address => GuestSession) public guestSessions;

	// When guest request for authorization with the lock
	event RequestAuth (address indexed guest, address indexed owner, LockNonce nonce);

	// When owner responds to authorization with the lock
	event RespondAuth (address indexed owner, address indexed guest,
					   LockNonce nonce, bool isOwnerVerfied);

	// When owner request's for bidding of the room	
	event BidRoomNow (address indexed owner, uint256 price);

	// When guest registers and wins bid or is a group member
	event GuestRegistered (address indexed guest, address indexed owner,
						   uint256 bid, uint256 groupRoot);

	// When guest is approved
	event GuestApproved (address indexed guest, address indexed owner, bytes nonce);

	// Register an Owner for the property
	function registerOwner (uint _basePrice, string memory _ipfsHash,
							uint256 _groupRoot, SemaphoreProof calldata proof)
		public onlyNoOwnerRegistered (msg.sender) {
		
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

        // Add owner
        OwnerSession memory ownerCtx;
		ownerCtx.registered = true;
		ownerCtx.groupRoot = _groupRoot;

        ownerSessions[msg.sender] = ownerCtx;

		console.log("Registering owner..");

		// Start the auction
		Auction.start(msg.sender, BID_INCREMENT, _basePrice, 
				block.number + 1, block.number + 10);			

		// Send out an event to all participants indicating start of bidding
		emit BidRoomNow (msg.sender, _basePrice);
	}

	// Register potential guest
	function registerGuest (address _owner, SemaphoreProof calldata proof)
		public payable 
		onlyIfOwnerExistsAndRegistered (_owner)
		returns (bool success) {
		uint _finalPrice;
		GuestSession memory guestCtx;
		OwnerSession memory ownerCtx = ownerSessions[_owner];

		// If this guest is part of the owner's group
		// skip the auction process
        if (proof.merkleTreeRoot == ownerCtx.groupRoot) {
			// Validate owner proof here (from Semaphore.sol @semaphore-protocol/contracts)
	        bool result = ISemaphoreVerifier(groupverifier).verifyProof(
	            [proof.points[0], proof.points[1]],
	            [[proof.points[2], proof.points[3]], [proof.points[4], proof.points[5]]],
	            [proof.points[6], proof.points[7]],
	            [proof.merkleTreeRoot, proof.nullifier, _hash(proof.message), _hash(proof.scope)],
	            proof.merkleTreeDepth
	        );

	        require(result);

	        guestCtx.groupRoot = ownerCtx.groupRoot;
        	console.log("Registering owner's guest..:", msg.value);
		
			emit GuestRegistered (msg.sender, _owner, msg.value,
								  ownerCtx.groupRoot);        
        }
        else {
	        guestCtx.groupRoot = ownerCtx.groupRoot;
			console.log("Registering guest..:", msg.value);
			Auction.placeBid(_owner);

			emit GuestRegistered (msg.sender, _owner, msg.value, 0);
        }

		guestSessions[msg.sender] = guestCtx;
		
		return (true);
	}

	// Owner wants to approve the guest
	function approveGuest (address _guest, bytes memory nonce)
		public 
		onlyIfOwnerExistsAndRegistered (msg.sender) {

		address _highestBidder;
		uint _bidPrice;
		GuestSession memory guestCtx;
		OwnerSession memory ownerCtx;

		console.log("Guest is:", _guest);

		ownerCtx = ownerSessions[msg.sender];		
		guestCtx = guestSessions[_guest];

		// If Owner's guest is part of the owner's group
		// skip the auction process
		if (guestCtx.groupRoot != ownerCtx.groupRoot) {

			// Only accept the first guest currently, then cancel auction
			Auction.cancelAuction(msg.sender);

			// Get the guest's bid
			(_highestBidder, _bidPrice) = Auction.getHighestBidAndBidder(msg.sender);

			//console.log("Highest Bidder is:", _highestBidder);
			//console.log("Bid Price:", _bidPrice);

			// Add guest to the list
			if (_guest == _highestBidder) {
				// counter value the guest needs to enter on the lock keypad
				// nonce will be populated when the guest arrives in vicintiy of the lock
				guestCtx.counter = 1234;
				guestCtx.id = 1;
				guestCtx.price = _bidPrice;
				guestSessions[_guest] = guestCtx;

				emit GuestApproved (_guest, msg.sender, nonce);
			}
		}
		else {
			guestCtx.counter = 1234;
			guestCtx.id = 1;
			guestSessions[_guest] = guestCtx;
			emit GuestApproved (_guest, msg.sender, nonce);
		}
	}

	// Guest requesting authenication on arrival
	function reqAuth (address _owner, LockNonce memory _nonce,
					  SemaphoreProof calldata proof)
		public onlyNotOwner onlyValidGuest (msg.sender) {

		GuestSession memory guestCtx = guestSessions[msg.sender];
		OwnerSession memory ownerCtx = ownerSessions[_owner];

		// If this guest is part of the owner's group validate its proof
        if ((proof.merkleTreeRoot == ownerCtx.groupRoot) && 
            (guestCtx.groupRoot == ownerCtx.groupRoot)) {

			// Validate guest proof here (from Semaphore.sol @semaphore-protocol/contracts)
	        bool result = ISemaphoreVerifier(groupverifier).verifyProof(
	            [proof.points[0], proof.points[1]],
	            [[proof.points[2], proof.points[3]], [proof.points[4], proof.points[5]]],
	            [proof.points[6], proof.points[7]],
	            [proof.merkleTreeRoot, proof.nullifier, _hash(proof.message), _hash(proof.scope)],
	            proof.merkleTreeDepth
	        );

			//console.log("Proof verifier(guest):", result);
			require(result);

			console.log("Registering Auth from guest");
			emit RequestAuth (msg.sender, _owner, _nonce);

		}
		else {
			
			console.log("Registering Auth from guest");
			emit RequestAuth (msg.sender, _owner, _nonce);
		}
	}

	// Owner's response to authenication
	function responseAuth (address _guest, LockNonce memory _nonce,
							uint[2] calldata _proof0, uint[2][2] calldata _proof1,
							uint[2] calldata _proof2, uint[16] calldata  _publicSignals)
		public onlyIfOwnerExistsAndRegistered (msg.sender)
		onlyValidGuest (_guest) {
		
		// Validate owner's proof here
		bool result = IGroth16Verifier(ownerverifier).verifyProof(
			_proof0, _proof1, _proof2, _publicSignals);

		//console.log("Proof verifier(owner):", result);
		require(result);

		// If valid owner forward the nonce (challenge) to lock
		console.log("Responding to Auth from guest");
		emit RespondAuth (msg.sender, _guest, _nonce, result);
	}

    // @dev Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
    // @param message: Message to be hashed.
    // @return Message digest.
    // (from Semaphore.sol @semaphore-protocol/contracts)
    function _hash(uint256 message) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(message))) >> 8;
    }

    modifier onlyNotOwner {
        if (ownerSessions[msg.sender].registered) revert();
        _;
    }

	modifier onlyNoOwnerRegistered (address _owner){
		if (ownerSessions[_owner].registered) revert();
		_;
	}

    modifier onlyValidGuest (address _guest) {
        if (guestSessions[_guest].id == 0) revert();
        _;
    }

    modifier onlyIfOwnerExistsAndRegistered (address _owner) {
        if (!ownerSessions[_owner].registered) revert();
        _;
    }    	
}