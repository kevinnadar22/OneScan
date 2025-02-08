// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentStorage {
    struct Document {
        string name;
        string description;
        string docType;
        string category;
        string fileCID; // IPFS/Filecoin CID
        uint256 createdAt;
        address owner;
        bool exists;  // To check if document exists
    }

    mapping(bytes32 => Document) public documents; // Store documents by unique hash
    event DocumentAdded(bytes32 indexed docId, address indexed owner, string name);

    function addDocument(
        bytes32 _docId,
        string memory _name,
        string memory _description,
        string memory _docType,
        string memory _category,
        string memory _fileCID
    ) public {
        require(!documents[_docId].exists, "Document already exists");
        
        documents[_docId] = Document({
            name: _name,
            description: _description,
            docType: _docType,
            category: _category,
            fileCID: _fileCID,
            createdAt: block.timestamp,
            owner: msg.sender,
            exists: true
        });
        
        emit DocumentAdded(_docId, msg.sender, _name);
    }

    function getDocument(bytes32 _docId) public view returns (
        string memory name,
        string memory description,
        string memory docType,
        string memory category,
        string memory fileCID,
        uint256 createdAt,
        address owner
    ) {
        require(documents[_docId].exists, "Document does not exist");
        Document storage doc = documents[_docId];
        return (
            doc.name,
            doc.description,
            doc.docType,
            doc.category,
            doc.fileCID,
            doc.createdAt,
            doc.owner
        );
    }
} 