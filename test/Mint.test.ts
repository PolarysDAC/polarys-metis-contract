import { expect } from 'chai';
import { ethers, network, upgrades } from 'hardhat';
const hre = require("hardhat");
import { parseUnits, formatUnits, parseEther } from "ethers/lib/utils";
import { PolarysNFTContract } from "../typechain-types";

import {
  getBigNumber
} from './utils'
import { BigNumber, Contract, Signer } from 'ethers';

describe('Test mint on the mainnet or testnet', () => {
  let polarysNFTContract: PolarysNFTContract
  let owner: Signer
  let ownerAddress: string

  const privateSalePrice = '250';
  const publicSalePrice = '300';
  const decimal = 6;
  const royaltyFee = '250';   //2.5%
  const baseURI = "https://bafybeihsrtpoz7vnzyjsrhbhzhxaih6mamykhyenfbjhutscve4kefvvuu.ipfs.nftstorage.link/"
  const depositMetisAmount = '0.03';
  const user3 = "0xf1CcdBE6B0Ba7b58e2bEe29C6bd47BeC2CEBB93A"

  before(async () => {
    [
      owner,
    ] = await ethers.getSigners()
    ownerAddress = await owner.getAddress()
    console.log("owner address is: ", ownerAddress);
    console.log('owner balance before action: ', formatUnits(await owner.getBalance()));
    console.log('===================Deploying Contract=====================')

    const contractFactory = await ethers.getContractFactory("PolarysNFTContract")
    polarysNFTContract = (await contractFactory.deploy("PolarysNFT", "PLY")) as PolarysNFTContract
    await polarysNFTContract.deployed()
    console.log('PolarysNFTContract deployed: ', polarysNFTContract.address)
    console.log('minter balance before action: ', formatUnits(await owner.getBalance()));
    
  })

  describe('Test: setup minter role', async () => {
    it('Setup Minter role', async () => {
      await polarysNFTContract.setupMinterRole(ownerAddress)
      await polarysNFTContract
        .setPrivateSalePrice(getBigNumber(privateSalePrice, decimal));
      
      await polarysNFTContract
        .setPublicSalePrice(getBigNumber(publicSalePrice, decimal));
      await polarysNFTContract.setRoyaltyFee(royaltyFee)
      
      await polarysNFTContract.setBaseURI(baseURI)
      await polarysNFTContract.startPrivateSale()
      const saleStatus = await polarysNFTContract.getSaleStatus()
    })
  })

  // describe('Test: set price', async () => {
  //   it('SetPrivateSalePrice', async () => {
  //     await expect(
  //       polarysNFTContract
  //       .setPrivateSalePrice(getBigNumber(privateSalePrice, decimal))
  //     ).to.emit(polarysNFTContract, "SetPrivateSalePrice")
  //     .withArgs(getBigNumber(privateSalePrice, decimal));

  //     await expect(
  //       polarysNFTContract
  //       .setPublicSalePrice(getBigNumber(publicSalePrice, decimal))
  //     ).to.emit(polarysNFTContract, "SetPublicSalePrice")
  //     .withArgs(getBigNumber(publicSalePrice, decimal));
  //   })
  // })

  // describe('Test: set royalty fee', async () => {
  //   it('SetRoyaltyFee', async () => {
  //     await expect(
  //       polarysNFTContract
  //       .setRoyaltyFee(royaltyFee)
  //     ).to.emit(polarysNFTContract, "SetRoyaltyFee")
  //     .withArgs(Number(royaltyFee));
  //   })
  // })

  // // describe('Test: deposit Metis', async () => {
  // //   it('Deposit Metis', async () => {
  // //     await expect(
  // //       polarysNFTContract
  // //       .depositMetis({value: parseEther(depositMetisAmount)})
  // //     ).to.emit(polarysNFTContract, "DepositedMetis")
  // //     .withArgs(getBigNumber(depositMetisAmount))
  // //   })
  // // })

  // describe('Test: set base URI', async () => {
  //   it('Set baseURI', async () => {
  //     await expect(
  //       polarysNFTContract
  //       .setBaseURI(baseURI)
  //     ).to.emit(polarysNFTContract, "SetBaseURI")
  //     .withArgs(baseURI)
  //   })
  // })

  describe('Test: Mint NFT', async () => {
    it('Mint NFTs to user', async () => {
      console.log('minter balance before action: ', formatUnits(await owner.getBalance()));
      // for (let i  = 0; i < 250; i ++) {
      //   await expect(
      //     polarysNFTContract
      //     .mint(user3, 10)
      //   ).to.emit(polarysNFTContract, "NFTMinted")
      //   .withArgs(user3, 10)
      // }
      const res = await polarysNFTContract.estimateGas.mint(user3, 10);
      console.log(formatUnits(res));
      let tx = await (await polarysNFTContract.mint(user3, 10)).wait();
      // console.log(tx);

      console.log('minter balance after action: ', formatUnits(await owner.getBalance()));
    })
  })
});
