import { ethers } from 'hardhat';
import { formatUnits } from "ethers/lib/utils";
import { PolarysNFTContract } from "../typechain-types";

import 'dotenv/config';
import { load } from "./utils"
import {
  getBigNumber,
} from '../test/utils'

import { Signer } from 'ethers';

async function main () {
  let signer: Signer
  let nftContract: PolarysNFTContract

  const minterWalletAddress = String(process.env.MINTER_WALLET)
  const nftContractAddress = (await load('PolarysNFTContract')).address

  nftContract = (await ethers.getContractAt("PolarysNFTContract", nftContractAddress)) as PolarysNFTContract;
  [signer] = await ethers.getSigners()
  
  await (
    await nftContract
    .connect(signer)
    .setupMinterRole(minterWalletAddress)
  ).wait();
  
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });