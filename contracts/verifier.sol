// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 16165768962999108823047939519556485068732984346777750203387227857218443222804;
    uint256 constant deltax2 = 18531654759917859529475874798279581633938671789643575871017924070423209274595;
    uint256 constant deltay1 = 8135716375424505837538847072311611504905112471159450929807737139387281992742;
    uint256 constant deltay2 = 8827815667822791442305656996796583022967368344029031539256569819085669707360;

    
    uint256 constant IC0x = 17533346812004164090697275667914105335665557510367318433325182122412264688023;
    uint256 constant IC0y = 10028366102370268833549590089637029331196678363691174095956096624679868873114;
    
    uint256 constant IC1x = 20080623279469257634216108842715768693607410136285954852360515958655020750346;
    uint256 constant IC1y = 16351877161546409578860878460459620869270870377830621973449852352640855422262;
    
    uint256 constant IC2x = 12036587816187142639303934720900115701385992760873243268625103842268019455052;
    uint256 constant IC2y = 19895012821036309996314953857370455527731099516260477681103318976184856337550;
    
    uint256 constant IC3x = 3415585203218366796208955730966619030274038438162851853574074461904425742062;
    uint256 constant IC3y = 7521164948947526041013616910426400796786914028291176136559269029020011466434;
    
    uint256 constant IC4x = 7570316023050505851482752223897264574160890030132182349521624394848531816988;
    uint256 constant IC4y = 12534049914244299610554936557916507137733195370484851213528918661078440488886;
    
    uint256 constant IC5x = 8847333259360141603161478422451768721802035418691263710233782757856512288983;
    uint256 constant IC5y = 11740199496704275573549260364844222977950246093175520242190441572163865383185;
    
    uint256 constant IC6x = 3740155600030893281706024746795567741590590940997084841458338621628117014596;
    uint256 constant IC6y = 10776764840380336883687538807291067783557101256796438550036987417197889076195;
    
    uint256 constant IC7x = 11591823963400758236727212763853879538618487383200794816456832551689852141965;
    uint256 constant IC7y = 20716072518919150470433947597012142685141982664693362346218507421722260311092;
    
    uint256 constant IC8x = 20106443093323612997718488294656065600277414939230007605301110558555221048130;
    uint256 constant IC8y = 11502136862074401489979221938288280529200200119682716728091125490080747390265;
    
    uint256 constant IC9x = 8768774092041308210141774203379401135921017112931835678852594513938038354807;
    uint256 constant IC9y = 1388767331237467221192755665005670558959872979446236243895917044758267570655;
    
    uint256 constant IC10x = 3677616897574149090752572974116146489046147722023048463065853365856344581116;
    uint256 constant IC10y = 12578935041745641761631594989306173922764343715231141724920697740357606746019;
    
    uint256 constant IC11x = 12056623398447519027745668112713928346600316362532984752349704520907765981865;
    uint256 constant IC11y = 1320075454273461173403506910818847364647718645962130442127609796424971879224;
    
    uint256 constant IC12x = 3271187945785442099418995715434978151988058592928366617587882545607423210953;
    uint256 constant IC12y = 2697054943822759427285922738187010821664480637471941381817456936776907474886;
    
    uint256 constant IC13x = 4813188989872609572500852418995271008616138191324059691856915315518706414291;
    uint256 constant IC13y = 2830604867675311477265768611713148872072602908825349112890588850039666085589;
    
    uint256 constant IC14x = 19696590639026129591046547024338024841854859164728462892232651188582916099785;
    uint256 constant IC14y = 6535045250494541991913781978668141037951979780937151879776907777888807601346;
    
    uint256 constant IC15x = 18470300664951013062170956185083452556165967800733522909874344512788478069549;
    uint256 constant IC15y = 1281902101163480608662318773248264347676644114750499888163316536648733939809;
    
    uint256 constant IC16x = 11578854694344041474144419160714368211724303418244129672743061253015784506062;
    uint256 constant IC16y = 12617556767292618516730079882518654734518563183802760801877789101194570145177;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[16] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
