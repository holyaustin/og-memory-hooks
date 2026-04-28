// contracts/CheckpointRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title CheckpointRegistry
 * @dev Stores and retrieves agent memory checkpoints on 0G Chain.
 * Used by the 0G-Memory-Hooks OpenClaw plugin.
 */
contract CheckpointRegistry {
    // Mapping from agent ID (string) to latest checkpoint root hash (string)
    mapping(string => string) private _latestCheckpoint;
    
    // Event emitted when a new checkpoint is saved
    event CheckpointSaved(
        string indexed agentId,
        string rootHash,
        uint256 timestamp,
        address indexed savedBy
    );
    
    // Event emitted when a checkpoint is overwritten/updated
    event CheckpointUpdated(
        string indexed agentId,
        string oldRootHash,
        string newRootHash,
        uint256 timestamp,
        address indexed updatedBy
    );

    /**
     * @dev Save or update the latest checkpoint for an agent
     * @param agentId Unique identifier for the agent/session
     * @param rootHash Merkle root hash from 0G Storage
     */
    function saveCheckpoint(string memory agentId, string memory rootHash) external {
        string memory currentHash = _latestCheckpoint[agentId];
        
        // Update storage
        _latestCheckpoint[agentId] = rootHash;
        
        // Emit appropriate event
        if (bytes(currentHash).length == 0) {
            emit CheckpointSaved(agentId, rootHash, block.timestamp, msg.sender);
        } else {
            emit CheckpointUpdated(agentId, currentHash, rootHash, block.timestamp, msg.sender);
        }
    }

    /**
     * @dev Get the latest checkpoint root hash for an agent
     * @param agentId Unique identifier for the agent/session
     * @return Root hash string, or empty string if none exists
     */
    function getLatestCheckpoint(string memory agentId) external view returns (string memory) {
        return _latestCheckpoint[agentId];
    }
    
    /**
     * @dev Check if an agent has any checkpoint
     * @param agentId Unique identifier for the agent/session
     * @return True if checkpoint exists
     */
    function hasCheckpoint(string memory agentId) external view returns (bool) {
        return bytes(_latestCheckpoint[agentId]).length > 0;
    }
}