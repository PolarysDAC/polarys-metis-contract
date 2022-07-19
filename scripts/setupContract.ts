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

  const DECIMALS = 6;
  const PRIVATE_SALE_PRICE = 200.5;
  const PUBLIC_SALE_PRICE = 220.5;
  const ROYALTY_FEE = 250;   // 2.5% royalty fee

  const minterWalletAddress = String(process.env.MINTER_WALLET)
  const nftContractAddress = (await load('PolarysNFTContract')).address

  nftContract = (await ethers.getContractAt("PolarysNFTContract", nftContractAddress)) as PolarysNFTContract;
  [signer] = await ethers.getSigners()
  
  const transaction1 = await nftContract
    .connect(signer).setPrivateSalePrice(getBigNumber(PRIVATE_SALE_PRICE, DECIMALS));
  await transaction1.wait();
  
  const transaction2 = await nftContract
    .connect(signer).setPublicSalePrice(getBigNumber(PUBLIC_SALE_PRICE, DECIMALS));
  await transaction2.wait();
  
  const newPrivatePrice = formatUnits(await nftContract.getPrivateSalePrice(), DECIMALS);
  console.log("privateSale price after set price: ", newPrivatePrice);

  const newPublicPrice = formatUnits(await nftContract.getPublicSalePrice(), DECIMALS);
  console.log("pubicSale price after set price: ", newPublicPrice);

  
  await (
    await nftContract
    .connect(signer)
    .setupMinterRole(minterWalletAddress)
  ).wait();
  console.log("Setup minter role");

  await (
    await nftContract
    .connect(signer)
    .setRoyaltyFee(ROYALTY_FEE)
  ).wait();
  const newRoyaltyFee = formatUnits(await nftContract.getRoyaltyFee(), 0);
  console.log("royalty fee: ", newRoyaltyFee);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });