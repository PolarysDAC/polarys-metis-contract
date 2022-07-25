import { expect } from 'chai';
import { ethers, network, upgrades } from 'hardhat';
const hre = require("hardhat");
import { parseUnits, formatUnits, parseEther } from "ethers/lib/utils";
import { PolarysNFTContract } from "../typechain-types";

import {
  getBigNumber
} from './utils'
import { BigNumber, Contract, Signer } from 'ethers';

describe('PolarysNFTContract-Test', () => {
  let polarysNFTContract: PolarysNFTContract
  let owner: Signer
  let user1: Signer
  let user2: Signer
  let user3: Signer
  let minter: Signer
  let ownerAddress: string
  let user1Address: string
  let user2Address: string
  let user3Address: string
  let minterAddress: string

  const privateSalePrice = '200.5';
  const publicSalePrice = '225.5';
  const decimal = 6;
  const royaltyFee = '250';   //2.5%
  const baseURI = "https://bafybeihsrtpoz7vnzyjsrhbhzhxaih6mamykhyenfbjhutscve4kefvvuu.ipfs.nftstorage.link/"
  const depositMetisAmount = '0.04';

  before(async () => {
    [
      owner, 
      user1, 
      user2,
      user3,
      minter, 
    ] = await ethers.getSigners()
    ownerAddress = await owner.getAddress()
    user1Address = await user1.getAddress()
    user2Address = await user2.getAddress()
    user3Address = await user3.getAddress()
    minterAddress = await minter.getAddress()
    
    console.log('===================Deploying Contract=====================')

    const contractFactory = await ethers.getContractFactory("PolarysNFTContract")
    polarysNFTContract = (await contractFactory.deploy("PolarysNFT", "PLY")) as PolarysNFTContract
    await polarysNFTContract.deployed()
    console.log('PolarysNFTContract deployed: ', polarysNFTContract.address)
    console.log('minter balance before action: ', formatUnits(await minter.getBalance()));
    
  })

  describe('Test: setup minter role', async () => {
    it('Caller is not the owner', async () => {
      await expect(
        polarysNFTContract
        .connect(user1)
        .setupMinterRole(minterAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    })
    it('Setup Minter role', async () => {
      polarysNFTContract.setupMinterRole(minterAddress)
    })
  })

  describe('Test: set price', async () => {
    it('Caller is not the owner', async () => {
      await expect(
        polarysNFTContract
        .connect(user1)
        .setPrivateSalePrice(getBigNumber(privateSalePrice, decimal))
      ).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(
        polarysNFTContract
        .connect(user1)
        .setPublicSalePrice(getBigNumber(publicSalePrice, decimal))
      ).to.be.revertedWith('Ownable: caller is not the owner');
    })
    it('SetPrivateSalePrice', async () => {
      await expect(
        polarysNFTContract
        .setPrivateSalePrice(getBigNumber(privateSalePrice, decimal))
      ).to.emit(polarysNFTContract, "SetPrivateSalePrice")
      .withArgs(getBigNumber(privateSalePrice, decimal));

      await expect(
        polarysNFTContract
        .setPublicSalePrice(getBigNumber(publicSalePrice, decimal))
      ).to.emit(polarysNFTContract, "SetPublicSalePrice")
      .withArgs(getBigNumber(publicSalePrice, decimal));
    })
  })

  describe('Test: set royalty fee', async () => {
    it('Caller is not the owner', async () => {
      await expect(
        polarysNFTContract
        .connect(user1)
        .setRoyaltyFee(royaltyFee)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    })
    it('SetRoyaltyFee', async () => {
      await expect(
        polarysNFTContract
        .setRoyaltyFee(royaltyFee)
      ).to.emit(polarysNFTContract, "SetRoyaltyFee")
      .withArgs(Number(royaltyFee));
    })
  })

  describe('Test: deposit Metis', async () => {
    it('Deposit Metis', async () => {
      await expect(
        polarysNFTContract
        .connect(minter)
        .depositMetis({value: parseEther(depositMetisAmount)})
      ).to.emit(polarysNFTContract, "DepositedMetis")
      .withArgs(getBigNumber(depositMetisAmount))
    })

    it('Can not withdraw Metis when not paused', async () => {
      await expect(
        polarysNFTContract
        .withdrawMetis(user1Address)
      ).to.be.revertedWith("Pausable: not paused");
    })
  })

  describe('Test: set base URI', async () => {
    it('Caller is not the owner', async () => {
      await expect(
        polarysNFTContract
        .connect(user1)
        .setBaseURI(baseURI)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    })
    it('Set baseURI', async () => {
      await expect(
        polarysNFTContract
        .setBaseURI(baseURI)
      ).to.emit(polarysNFTContract, "SetBaseURI")
      .withArgs(baseURI)
    })
  })

  describe('Test: Mint NFT', async () => {
    it('Caller is not the Minter role', async () => {
      await expect(
        polarysNFTContract
        .connect(user1)
        .mint(user1Address, 2)
      ).to.be.reverted;
    })
    // it('Cannot mint NFT to CA ', async () => {
    //   await expect(
    //     polarysNFTContract
    //     .connect(polarysNFTContract.address)
    //     .mint(user1Address, 2)
    //   ).to.be.revertedWith('Can not mint NFT to contract address');
    // })
    it('Mint 5 NFTs to user1', async () => {
      console.log('user1 metis balance before mint: ', formatUnits(await user1.getBalance()));
      console.log('minter balance before action: ', formatUnits(await minter.getBalance()));
      await expect(
        polarysNFTContract
        .connect(minter)
        .mint(user1Address, 10)
      ).to.emit(polarysNFTContract, "NFTMinted")
      .withArgs(user1Address, 10)
      console.log('user1 metis balance after mint: ', formatUnits(await user1.getBalance()));
    })

    it('Mint 10 NFTs to user2', async () => {
      console.log('user2 metis balance before mint: ', formatUnits(await user2.getBalance()));
      console.log('minter balance before action: ', formatUnits(await minter.getBalance()));
      await expect(
        polarysNFTContract
        .connect(minter)
        .mint(user2Address, 10)
      ).to.emit(polarysNFTContract, "NFTMinted")
      .withArgs(user2Address, 10)
      console.log('user2 metis balance after mint: ', formatUnits(await user2.getBalance()));
    })

    it('Cannot mint more than 10 NFTs at once', async () => {
      await expect(
        polarysNFTContract
        .connect(minter)
        .mint(user2Address, 11)
      ).to.be.revertedWith("Can not mint NFTs more than 10 NFTs at one transaction")
    })

    it('Mint 2480 NFTs to user3', async () => {
      console.log('user3 metis balance before mint: ', formatUnits(await user3.getBalance()));
      console.log('minter balance before action: ', formatUnits(await minter.getBalance()));

      for (let i  = 0; i < 248; i ++) {
        await expect(
          polarysNFTContract
          .connect(minter)
          .mint(user3Address, 10)
        ).to.emit(polarysNFTContract, "NFTMinted")
        .withArgs(user3Address, 10)
      }
      console.log('user3 metis balance after mint: ', formatUnits(await user3.getBalance()));
      console.log('minter balance after action: ', formatUnits(await minter.getBalance()));
    })
    it('Can not mint NFT more than MAX_SUPPLY ', async () => {
      await expect(
        polarysNFTContract
        .connect(minter)
        .mint(user1Address, 1)
      ).to.be.revertedWith('Can not mint NFT more than MAX_SUPPLY');
    })
  })

  describe('Test: Cannot set price, royaltyFee when paused', async () => {
    it('Cannot set price when paused', async () => {
      await expect(
        polarysNFTContract
        .setPrivateSalePrice(getBigNumber(100, decimal))
      ).to.be.revertedWith("Pausable: paused");
      await expect(
        polarysNFTContract
        .setPublicSalePrice(getBigNumber(100, decimal))
      ).to.be.revertedWith("Pausable: paused");
    })
    it('Cannot set royaltyFee when paused', async () => {
      await expect(
        polarysNFTContract
        .setRoyaltyFee(100)
      ).to.be.revertedWith("Pausable: paused");
    })
  })

  describe('Test: Withdraw Metis', async () => {

    it('Deposit Metis', async () => {
      await expect(
        polarysNFTContract
        .connect(minter)
        .depositMetis({value: parseEther(depositMetisAmount)})
      ).to.emit(polarysNFTContract, "DepositedMetis")
      .withArgs(parseEther(depositMetisAmount))
    })

    it('Withdraw Metis', async () => {
      const balance = await polarysNFTContract.metisBalance();
      console.log(balance)
      console.log("user1 balance before withdraw: ", formatUnits(await user1.getBalance()));
      await expect(
        polarysNFTContract
        .withdrawMetis(user1Address)
      ).to.emit(polarysNFTContract, "WithdrewMetis")
      .withArgs(user1Address, balance)
      console.log("user1 balance after withdraw: ", formatUnits(await user1.getBalance()));
    })

    it('No balance', async () => {
      console.log("Current balance: ", formatUnits(await polarysNFTContract.metisBalance()));
      await expect(
        polarysNFTContract
        .withdrawMetis(user1Address)
      ).to.be.revertedWith("No balance");
    })
  })
});
