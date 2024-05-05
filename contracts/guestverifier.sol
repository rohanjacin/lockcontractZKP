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

contract GuestVerifier {
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
    uint256 constant deltax1 = 17572917438164001726028295323715274012905621170227222165997344381386517520261;
    uint256 constant deltax2 = 17602372586676987766995048739644170679787613057153744790798591777405256541877;
    uint256 constant deltay1 = 5533709918217333935084820360229953711882044481689918213708155349488417111679;
    uint256 constant deltay2 = 15888405700877500733744259106367112114633359319461408173100261421423175111681;

    
    uint256 constant IC0x = 2680627351958034103819027265505200761950031164385936947833134170737517974126;
    uint256 constant IC0y = 8546863692391224728310396699138712487964358874957998903337780705470100702942;
    
    uint256 constant IC1x = 8087715975443738678541860593232939221482340403332160686441030687457586077516;
    uint256 constant IC1y = 15751279469364330309959742576686693392134523792368879804694636097288010754010;
    
    uint256 constant IC2x = 972835861926066250350344547802116657889277587976477202881918910993848262607;
    uint256 constant IC2y = 8001427728067440075370360246820270276346299195291495719408564606669563118402;
    
    uint256 constant IC3x = 15608349159175610699588930558126196795551122938483085534951458047196305246104;
    uint256 constant IC3y = 8641402019440397969217104275328379951906285901396649306124326045037763601351;
    
    uint256 constant IC4x = 8691132664514014516292201724607991859445015269674316238424196398932603439943;
    uint256 constant IC4y = 14030622071289642212292405413172673753587795826510511794181558491369446561629;
    
    uint256 constant IC5x = 184009106848739441305635861378199244700209226721978367172992228506591695434;
    uint256 constant IC5y = 15028746021799305738567360478482049314557970253227362871272155012422830682481;
    
    uint256 constant IC6x = 2066932909857543544810221425838212811272008536303214349634972826692157698152;
    uint256 constant IC6y = 651378184671141997595495664504054503194289815652771371069391792565908520479;
    
    uint256 constant IC7x = 14204226101666877248121673780801759140777707745469470364732444971478927495180;
    uint256 constant IC7y = 13711489451601273650899364151868449613977143779118730479200891562996590940125;
    
    uint256 constant IC8x = 4607852139669718517863403616115402425220671934062280189657142274173640778932;
    uint256 constant IC8y = 5659103836719612346374605705530049461266269010426126731503222074077149604685;
    
    uint256 constant IC9x = 15622968192036038539504360219218819807989100181748411043654837777292596920916;
    uint256 constant IC9y = 587062898010276121007094796612820713335885443926168333391486683884398024670;
    
    uint256 constant IC10x = 4935809021751436908684248851377662388187681255076016333880800648745964905598;
    uint256 constant IC10y = 20535212280235876048853602146619234587197227408820724107857846021428067959921;
    
    uint256 constant IC11x = 18407422426971496326296050375212682223478289463578397255807470053760457305417;
    uint256 constant IC11y = 10064962852538229055989221484401995360336490147643703014436453226492350873740;
    
    uint256 constant IC12x = 21063144301559058852321688332601927021489821297167659928351310599537493599630;
    uint256 constant IC12y = 1204027287016071182307457780378268474690850925632066635110591372790015791092;
    
    uint256 constant IC13x = 21529547969077368621297574149906462667275249721582032607282469395232624448740;
    uint256 constant IC13y = 20880877287399360275191844319523944399702105404245474494327406631672854097694;
    
    uint256 constant IC14x = 3415368374876538967910903355860503982235534399671051731114496103667185143502;
    uint256 constant IC14y = 13455496370044153741140079123101132211124713547024200154822591547710213342432;
    
    uint256 constant IC15x = 2799750457767240087773496650472055163233166216848360311029292078447047542585;
    uint256 constant IC15y = 14697822983553488739092331175291475915016343458641943887024691191052373740517;
    
    uint256 constant IC16x = 634193598494748820149947612912941429487583397092130199630835547671826121476;
    uint256 constant IC16y = 7542927755500682095413455904445365310699312342829473800554406883625741360403;
    
    uint256 constant IC17x = 11241973218901978524442403595925470024451959868835899255046160246964606986774;
    uint256 constant IC17y = 2545021398911279936127910988437008229000029777618434534190333010019311317507;
    
    uint256 constant IC18x = 1020754057716469201001944235768081719846095647593560653735591286871027213407;
    uint256 constant IC18y = 3571635171606878733259303670924812997288430692610928440424934901380393801619;
    
    uint256 constant IC19x = 16017385340573909736893995563291694397873547559050947822011971026917220565778;
    uint256 constant IC19y = 6948207587597185671577626049416515742757818019759087556476512465056023318560;
    
    uint256 constant IC20x = 19650548757023315689901374137512595209270080466678946593436728595223356441060;
    uint256 constant IC20y = 9551549852049445205976209157316594450359092831810651309741071273082270127458;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[20] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                

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
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
