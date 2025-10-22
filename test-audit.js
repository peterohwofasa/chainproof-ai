const fetch = require('node-fetch');

const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VulnerableToken is ERC20, Ownable {
    mapping(address => uint256) public balances;
    
    constructor() ERC20("Vulnerable", "VULN") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    // Vulnerability: Reentrancy
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
    
    // Vulnerability: Integer overflow/underflow
    function transfer(address to, uint256 amount) public override returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}`;

async function testAuditSubmission() {
    try {
        console.log('Submitting audit request...');
        
        const response = await fetch('http://localhost:3000/api/audit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contractCode: sampleContract,
                contractName: 'VulnerableToken',
                auditType: 'OPENAI_AGENT'
            })
        });

        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(result, null, 2));

        if (result.auditId) {
            console.log('Audit submitted successfully! Audit ID:', result.auditId);
            
            // Wait a moment and check audit status
            setTimeout(async () => {
                try {
                    const statusResponse = await fetch(`http://localhost:3000/api/audits/${result.auditId}`);
                    const statusResult = await statusResponse.json();
                    console.log('Audit status:', JSON.stringify(statusResult, null, 2));
                } catch (error) {
                    console.error('Error checking audit status:', error);
                }
            }, 2000);
        }

    } catch (error) {
        console.error('Error submitting audit:', error);
    }
}

testAuditSubmission();