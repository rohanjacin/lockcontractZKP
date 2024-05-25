const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const { generateProof } = require("@semaphore-protocol/proof");
const BN = require("bn.js");

let createMembership = async function () {
    // Create identities for family members
    const identity1 = new Identity("self-secret");
    const identity2 = new Identity("spouse-secret");
    const identity3 = new Identity("kid-secret");

    const members = [identity1.commitment, identity2.commitment, identity3.commitment];
    console.log("members:", members);

    const family = new Group(members);
    console.log("family:", family);

    const identity1Proof = await family.generateMerkleProof(0);
    const identity2Proof = await family.generateMerkleProof(1);
    const identity3Proof = await family.generateMerkleProof(2);

    console.log("family.root:" + family.root);
    console.log("Self -> commitment | proof: \n", identity1.commitment, identity1Proof);
    console.log("Spouse -> commitment | proof: \n", identity2.commitment, identity2Proof);
    console.log("Kid -> commitment | proof: \n", identity3.commitment, identity3Proof);
    let proof = await generateProof(identity2, family, "Spouse", family.root);
    console.log("PROOF:", proof);
    
    const exportedGroup = family.export();
    console.log("family.export:" + exportedGroup);
    const newGroup = Group.import(exportedGroup);
    console.log("newGroup:", newGroup);
    const newidentity1Proof = await newGroup.generateMerkleProof(0);
    const newidentity2Proof = await newGroup.generateMerkleProof(1);
    const newidentity3Proof = await newGroup.generateMerkleProof(2);

    console.log("new family.root:" + newGroup.root);
    console.log("new Self -> commitment | proof: \n", newGroup.members[0], newidentity1Proof);
    console.log("new Spouse -> commitment | proof: \n", newGroup.members[1], newidentity2Proof);
    console.log("new Kid -> commitment | proof: \n", newGroup.members[2], newidentity2Proof);


    console.log("newGroup.export:", newGroup.export());

}

createMembership();
