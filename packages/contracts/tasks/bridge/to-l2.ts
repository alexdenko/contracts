import { task } from 'hardhat/config'
import { BigNumber } from 'ethers'
import { GRE_TASK_PARAMS } from '@graphprotocol/sdk/gre'
import { sendToL2 } from '@graphprotocol/sdk'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { TASK_NITRO_SETUP_SDK } from '../deployment/nitro'

export const TASK_BRIDGE_TO_L2 = 'bridge:send-to-l2'

task(TASK_BRIDGE_TO_L2, 'Bridge GRT tokens from L1 to L2')
  .addParam('amount', 'Amount of tokens to bridge')
  .addOptionalParam('sender', 'Address of the sender. L1 deployer if empty.')
  .addOptionalParam('recipient', 'Receiving address in L2. Same to L1 address if empty.')
  .addOptionalParam('addressBook', GRE_TASK_PARAMS.addressBook.description)
  .addOptionalParam(
    'arbitrumAddressBook',
    GRE_TASK_PARAMS.arbitrumAddressBook.description,
    GRE_TASK_PARAMS.arbitrumAddressBook.default,
  )
  .addOptionalParam('l1GraphConfig', GRE_TASK_PARAMS.graphConfig.description)
  .addOptionalParam('l2GraphConfig', GRE_TASK_PARAMS.graphConfig.description)
  .addOptionalParam(
    'deploymentFile',
    'Nitro testnode deployment file. Must specify if using nitro test nodes.',
  )
  .setAction(async (taskArgs, hre) => {
    console.log('> Sending GRT to L2')
    const graph = hre.graph(taskArgs)

    // If local, add nitro test node networks to sdk
    if (taskArgs.deploymentFile) {
      console.log('> Adding nitro test node network to sdk')
      await hre.run(TASK_NITRO_SETUP_SDK, { deploymentFile: taskArgs.deploymentFile })
    }

    // Get the sender, use L1 deployer if not provided
    const l1Deployer = await graph.l1.getDeployer()
    const sender: string = taskArgs.sender ?? l1Deployer.address

    const signer = await SignerWithAddress.create(graph.l1.provider.getSigner(sender))
    if (!signer) {
      throw new Error(`No wallet found for address ${sender}`)
    }
    console.log(`> Using wallet ${signer.address}`)

    // Patch sendToL2 opts
    taskArgs.l2Provider = graph.l2.provider
    taskArgs.amount = hre.ethers.utils.parseEther(taskArgs.amount) // sendToL2 expects amount in GRT

    // L2 provider gas limit estimation has been hit or miss in CI, 400k should be more than enough
    if (process.env.CI) {
      taskArgs.maxGas = BigNumber.from('400000')
    }

    await sendToL2(graph.contracts, signer, {
      l2Provider: graph.l2.provider,
      amount: taskArgs.amount,
      recipient: taskArgs.recipient,
      maxGas: taskArgs.maxGas,
      gasPriceBid: taskArgs.gasPriceBid,
      maxSubmissionCost: taskArgs.maxSubmissionCost,
    })

    console.log('Done!')
  })
