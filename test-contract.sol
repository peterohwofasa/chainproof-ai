// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableContract {
    mapping(address => uint256) public balances;
    address public owner;
    bool private locked;
    
    event Withdrawal(address indexed user, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    // Vulnerable function - missing access control
    function setOwner(address newOwner) public {
        owner = newOwner;
    }
    
    // Vulnerable function - reentrancy attack possible
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // External call before state change - VULNERABLE TO REENTRANCY
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        // State change after external call
        balances[msg.sender] -= amount;
        
        emit Withdrawal(msg.sender, amount);
    }
    
    // Vulnerable function - integer overflow (in older Solidity versions)
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // Vulnerable function - gas limit DoS
    function distributeRewards(address[] memory recipients) public {
        require(msg.sender == owner, "Only owner");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            // Unbounded loop with external calls - GAS LIMIT DOS
            (bool success, ) = recipients[i].call{value: 1 ether}("");
            require(success, "Transfer failed");
        }
    }
    
    // Vulnerable function - unchecked external call
    function forwardFunds(address payable target, uint256 amount) public {
        require(msg.sender == owner, "Only owner");
        
        // Unchecked external call - doesn't handle failure
        target.call{value: amount}("");
    }
    
    // Missing function - no way to check contract balance
    // Missing events for important state changes
    
    // Vulnerable to front-running
    function buyToken(uint256 price) public payable {
        require(msg.value == price, "Incorrect payment");
        // Token purchase logic without protection against front-running
    }
    
    // Timestamp dependence vulnerability
    function timeBasedAction() public {
        require(block.timestamp > 1640995200, "Too early"); // Vulnerable to miner manipulation
        // Some time-sensitive action
    }
    
    // Delegatecall vulnerability
    function delegateCallExample(address target, bytes memory data) public {
        require(msg.sender == owner, "Only owner");
        // Dangerous delegatecall without proper validation
        target.delegatecall(data);
    }
    
    // Self-destruct vulnerability
    function emergencyDestroy() public {
        require(msg.sender == owner, "Only owner");
        // Self-destruct without proper safeguards
        selfdestruct(payable(owner));
    }
}