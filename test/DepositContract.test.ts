import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
const hre = require("hardhat");
import { parseUnits, formatUnits } from "ethers/lib/utils";
import { DepositContract, TestToken } from "../typechain-types";

import {
  getBigNumber
} from './utils'
import { BigNumber, Contract, Signer } from 'ethers';

describe('DepositContract-Test', () => {
  let depositContract: DepositContract
  let testToken: TestToken
  let owner: Signer
  let user1: Signer
  let user2: Signer
  let admin: Signer
  let receipient: Signer
  let testTokenSigner: Signer
  let ownerAddress: string
  let user1Address: string
  let user2Address: string
  let adminAddress: string
  let receipientAddress: string

  before(async () => {
    [
      owner, 
      user1, 
      user2,
      admin, 
      receipient,
    ] = await ethers.getSigners()
    ownerAddress = await owner.getAddress()
    user1Address = await user1.getAddress()
    user2Address = await user2.getAddress()
    adminAddress = await admin.getAddress()
    receipientAddress = await receipient.getAddress()
    
    console.log('===================Deploying Contract=====================')

    const tokenFactory = await ethers.getContractFactory("TestToken")
    testToken = (await upgrades.deployProxy(
        tokenFactory, 
        [
            "TestCoin",
            "TTC",
            18
        ]
    )
    ) as TestToken
    await testToken.deployed()
    console.log('TestToken deployed: ', testToken.address)

    const contractFactory = await ethers.getContractFactory("DepositContract")
    depositContract = (await upgrades.deployProxy(contractFactory, [testToken.address])) as DepositContract
    await depositContract.deployed()
    console.log('DepositContract deployed: ', depositContract.address)

    await testToken.mint(user1Address, getBigNumber(1000));
    await testToken.mint(user2Address, getBigNumber(1000));

    // testContract.receiveEther({value: ethers.utils.parseEther("10")});
    // testTokenSigner = await ethers.getSigner(testContract.address);

    // console.log("testToken balance is: ", formatUnits(await testTokenSigner.getBalance()));
    await depositContract.setupAdminRole(adminAddress);
  })

  describe('depositToken() test', async () => {
    it('can not send token in contract', async () => {
    })
    
    it('user should approve token amount', async () => {
      await expect(depositContract
        .connect(user1)
        .depositToken(getBigNumber(50))
      ).to.be.reverted;
    })
    
    it('user1 deposits 50 tokens', async () => {
      await testToken.connect(user1).approve(depositContract.address, getBigNumber(50));
      await expect(depositContract
        .connect(user1)
        .depositToken(getBigNumber(50))
      ).to.emit(depositContract, "DepositedToken")
      .withArgs(testToken.address, user1Address, getBigNumber(50), 1);
    })

    it('user2 deposits 50 tokens', async () => {
      await testToken.connect(user2).approve(depositContract.address, getBigNumber(50));
      await expect(depositContract
        .connect(user2)
        .depositToken(getBigNumber(50))
      ).to.emit(depositContract, "DepositedToken")
      .withArgs(testToken.address, user2Address, getBigNumber(50), 2);
    })
  })

  describe('withdrawToken() test', async () => {
    it('only admin can execute withdrawToken()', async () => {
      await expect(depositContract
        .connect(user1)
        .withdrawToken(user1Address, getBigNumber(50))
      ).to.be.reverted;
    })
    
    it('not allowed to withdraw insufficient amount', async () => {
      await expect(depositContract
        .connect(admin)
        .withdrawToken(user1Address, getBigNumber(500))
      ).to.be.reverted;
    })

    it('admin withdraws 50 tokens to user1', async () => {
      await expect(depositContract
        .connect(admin)
        .withdrawToken(user1Address, getBigNumber(50))
      ).to.emit(depositContract, "WithdrawedToken")
      .withArgs(testToken.address, user1Address, getBigNumber(50));
    })

    it('admin withdraws 50 tokens to user2', async () => {
      await expect(depositContract
        .connect(admin)
        .withdrawToken(user2Address, getBigNumber(50))
      ).to.emit(depositContract, "WithdrawedToken")
      .withArgs(testToken.address, user2Address, getBigNumber(50));
    })

  })
});
