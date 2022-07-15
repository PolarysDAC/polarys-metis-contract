import hre from "hardhat";
import { ethers } from 'hardhat'
import { load } from "./utils"

import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const tokenAddress = process.env.DEPOSIT_TOKEN_ADDRESS || "0xFE724a829fdF12F7012365dB98730EEe33742ea2";
    const contractAddress = (await load('DepositContract')).address
    console.log(contractAddress)
    await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
            tokenAddress
        ],
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});