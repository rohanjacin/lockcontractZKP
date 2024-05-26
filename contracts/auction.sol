//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 ** @title Auction library
 ** @dev Library handling the bidding of rooms
 ** 
 ** Original code from https://github.com/brynbellomy/solidity-auction
 **/

library Auction {

    // state
    struct AuctionState {
        bool canceled;
        bool ownerHasWithdrawn;
        uint highestBindingBid;
        uint bidIncrement;
        uint startBlock;
        uint endBlock;
        address highestBidder;
        address owner;
        mapping(address => uint256) fundsByBidder;
    }

    //event LogBid(address bidder, uint bid, address highestBidder, uint highestBid, uint highestBindingBid);
    //event LogWithdrawal(address withdrawer, address withdrawalAccount, uint amount);
    //event LogCanceled();

    function _auctionStateStorage (address _owner)
        internal 
        returns (AuctionState storage state) {
        bytes32 position = keccak256(abi.encodePacked(address(this), _owner)); 
        assembly {
            state.slot := position
        }
    }

    function start (address _owner, uint _bidIncrement, uint _highestBindingBid,
                     uint _startBlock, uint _endBlock)
        external
        returns (bool) {
        if (_startBlock >= _endBlock) revert();
        if (_startBlock < block.number) revert();
        if (_owner == address(0)) revert();

        AuctionState storage state = _auctionStateStorage(_owner);  
        state.owner = _owner;
        state.bidIncrement = _bidIncrement;
        state.highestBindingBid = _highestBindingBid;
        state.startBlock = _startBlock;
        state.endBlock = _endBlock;
        return true;
    }

    function getHighestBidAndBidder(address _owner)
        external
        returns (address, uint)
    {
        AuctionState storage state = _auctionStateStorage(_owner);
        return (state.highestBidder, state.fundsByBidder[state.highestBidder]);
    }

    function placeBid(address _owner)
        external
        onlyAfterStart (_owner)
        onlyBeforeEnd (_owner)
        onlyNotCanceled (_owner)
        onlyNotOwner
        returns (bool success)
    {
        // reject payments of 0 ETH
        console.log("Placing bid:", msg.value);
        console.log("bid from:", msg.sender);

        if (msg.value == 0) revert("0 ETH send to placeBid");

        AuctionState storage state = _auctionStateStorage(_owner);

        // calculate the user's total bid based on the current amount they've sent to the contract
        // plus whatever has been sent with this transaction
        uint newBid = state.fundsByBidder[msg.sender] + msg.value;

        // if the user isn't even willing to overbid the highest binding bid, there's nothing for us
        // to do except revert the transaction.
        if (newBid <= state.highestBindingBid) revert();

        // grab the previous highest bid (before updating fundsByBidder, in case msg.sender is the
        // highestBidder and is just increasing their maximum bid).
        uint highestBid = state.fundsByBidder[state.highestBidder];

        state.fundsByBidder[msg.sender] = newBid;

        if (newBid <= highestBid) {
            // if the user has overbid the highestBindingBid but not the highestBid, we simply
            // increase the highestBindingBid and leave highestBidder alone.

            // note that this case is impossible if msg.sender == highestBidder because you can never
            // bid less ETH than you've already bid.

            state.highestBindingBid = min(newBid + state.bidIncrement, highestBid);
        } else {
            // if msg.sender is already the highest bidder, they must simply be wanting to raise
            // their maximum bid, in which case we shouldn't increase the highestBindingBid.

            // if the user is NOT highestBidder, and has overbid highestBid completely, we set them
            // as the new highestBidder and recalculate highestBindingBid.

            if (msg.sender != state.highestBidder) {
                state.highestBidder = msg.sender;
                state.highestBindingBid = min(newBid, highestBid + state.bidIncrement);
            }
            highestBid = newBid;
        }

        //emit LogBid(msg.sender, newBid, state.highestBidder, 
        //            highestBid, state.highestBindingBid);
        return true;
    }

    function min(uint a, uint b)
        private
        pure
        returns (uint)
    {
        if (a < b) return a;
        return b;
    }

    function cancelAuction(address _owner)
        external
        onlyOwner
        onlyBeforeEnd (_owner)
        onlyNotCanceled (_owner)
        returns (bool success)
    {
        AuctionState storage state = _auctionStateStorage(_owner);

        state.canceled = true;
        //emit LogCanceled();
        return true;
    }

    function withdraw(address _owner)
        external
        onlyEndedOrCanceled (_owner)
        returns (bool success)
    {
        address withdrawalAccount;
        uint withdrawalAmount;

        AuctionState storage state = _auctionStateStorage(_owner);

        if (state.canceled) {
            // if the auction was canceled, everyone should simply be allowed to withdraw their funds
            withdrawalAccount = msg.sender;
            withdrawalAmount = state.fundsByBidder[withdrawalAccount];

        } else {
            // the auction finished without being canceled

            if (msg.sender == state.owner) {
                // the auction's owner should be allowed to withdraw the highestBindingBid
                withdrawalAccount = state.highestBidder;
                withdrawalAmount = state.highestBindingBid;
                state.ownerHasWithdrawn = true;

            } else if (msg.sender == state.highestBidder) {
                // the highest bidder should only be allowed to withdraw the difference between their
                // highest bid and the highestBindingBid
                withdrawalAccount = state.highestBidder;
                if (state.ownerHasWithdrawn) {
                    withdrawalAmount = state.fundsByBidder[state.highestBidder];
                } else {
                    withdrawalAmount = state.fundsByBidder[state.highestBidder] - 
                                        state.highestBindingBid;
                }

            } else {
                // anyone who participated but did not win the auction should be allowed to withdraw
                // the full amount of their funds
                withdrawalAccount = msg.sender;
                withdrawalAmount = state.fundsByBidder[withdrawalAccount];
            }
        }

        if (withdrawalAmount == 0) revert();

        state.fundsByBidder[withdrawalAccount] -= withdrawalAmount;

        // send the funds
        //if (!payable(msg.sender).send(withdrawalAmount)) revert();

        //emit LogWithdrawal(msg.sender, withdrawalAccount, withdrawalAmount);

        return true;
    }

    modifier onlyOwner {
        AuctionState storage state = _auctionStateStorage(msg.sender);

        if (msg.sender != state.owner) revert();
        _;
    }

    modifier onlyNotOwner {
        AuctionState storage state = _auctionStateStorage(msg.sender);

        if (msg.sender == state.owner) revert();
        _;
    }

    modifier onlyAfterStart (address _owner) {
        AuctionState storage state = _auctionStateStorage(_owner);
       
        if (block.number < state.startBlock) revert();
        _;
    }

    modifier onlyBeforeEnd (address _owner) {
        AuctionState storage state = _auctionStateStorage(_owner);

        if (block.number > state.endBlock) revert();
        _;
    }

    modifier onlyNotCanceled (address _owner) {
        AuctionState storage state = _auctionStateStorage(_owner);

        if (state.canceled) revert();
        _;
    }

    modifier onlyEndedOrCanceled (address _owner) {
        AuctionState storage state = _auctionStateStorage(_owner);

        if (block.number < state.endBlock && !state.canceled) revert();
        _;
    }
}