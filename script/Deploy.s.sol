// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {EmberAppStore} from "../src/EmberAppStore.sol";

contract DeployScript is Script {
    function run() external {
        // Load from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address emberToken = vm.envAddress("EMBER_TOKEN");
        address stakingContract = vm.envAddress("STAKING_CONTRACT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        EmberAppStore store = new EmberAppStore(
            emberToken,
            address(0), // No oracle yet, use fallback price
            stakingContract
        );
        
        console2.log("EmberAppStore deployed at:", address(store));
        
        vm.stopBroadcast();
    }
}
