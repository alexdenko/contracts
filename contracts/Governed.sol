pragma solidity ^0.6.4;
pragma experimental ABIEncoderV2;


/*
 * @title Graph Governance contract
 * @notice All contracts that will be owned by a Governor entity should extend this contract
 */

contract Governed {
    address public governor;

    event GovernanceTransferred(address indexed _from, address indexed _to);

    modifier onlyGovernor {
        require(msg.sender == governor, "Only Governor can call");
        _;
    }

    /**
     * @dev All `Governed` contracts are constructed using an address for the `governor`
     * @param _governor <address> Address of initial `governor` of the contract
     */
    constructor(address _governor) public {
        governor = _governor;
    }

    /**
     * @dev The current `governor` can assign a new `governor`
     * @param _newGovernor <address> Address of new `governor`
     */
    function transferOwnership(address _newGovernor)
        public
        onlyGovernor
        returns (bool)
    {
        governor = _newGovernor;
        return true;
    }
}
