import { ethers, upgrades } from 'hardhat'
import { save } from "./utils"

import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const factory = await ethers.getContractFactory("PolarysNFTContract");
    let contract = await factory.deploy("PolarysNFT", "PLY");
    await contract.deployed();
    console.log("PolarysNFTContract deployed to:", contract.address);
    await save('PolarysNFTContract', {
        address: contract.address
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});