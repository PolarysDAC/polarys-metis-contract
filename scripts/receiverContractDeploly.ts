import { ethers, upgrades } from 'hardhat'
import { save } from "./utils"

import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const tokenAddress = process.env.DEPOSIT_TOKEN_ADDRESS || "0xFE724a829fdF12F7012365dB98730EEe33742ea2";
    const factory = await ethers.getContractFactory("DepositContract");
    const depositContract = await upgrades.deployProxy(factory, [tokenAddress]);
    await depositContract.deployed();
    console.log("DepositContract deployed to:", depositContract.address);
    await save('DepositContract', {
        address: depositContract.address
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});