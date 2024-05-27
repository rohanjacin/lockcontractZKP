
// Sort guest with according to bid value
function highestBiddingGuest(guests) {

    for (var i = 0; i < guests.length; i++) {

        // Last i elements are already in place  
        for (var j = 0; j < (guests.length - i - 1); j++) {

            // Checking if the item at present iteration 
            // is greater than the next iteration
            if (guests[j].bid > guests[j + 1].bid) {

                // If the condition is true
                // then swap them
                var temp = guests[j]
                guests[j] = guests[j + 1]
                guests[j + 1] = temp
            }
        }
    }

    // Print the sorted array
    console.log(guests);
    return guests[guests.length-1].address;
}

module.exports.highestBiddingGuest = highestBiddingGuest;