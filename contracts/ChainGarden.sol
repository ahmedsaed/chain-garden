// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ChainGarden
/// @notice A growing garden of tokens. Each can carry on-chain metadata, an IPFS pointer, or both.
contract ChainGarden is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct TokenData {
        string name;
        string description;
        string uri; // IPFS or empty
    }

    mapping(uint256 => TokenData) private _tokenData;

    event TokenMinted(uint256 indexed tokenId, address indexed to, string name);

    constructor() ERC721("Chain Garden", "LILY") Ownable(msg.sender) {}

    /// Mint a token with on-chain metadata, IPFS URI, or both.
    /// @param to Recipient address
    /// @param name On-chain name (empty string if IPFS-only)
    /// @param description On-chain description (empty string if IPFS-only)
    /// @param uri IPFS URI (empty string if on-chain only)
    function mint(
        address to,
        string memory name,
        string memory description,
        string memory uri
    ) external onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _tokenData[tokenId] = TokenData(name, description, uri);
        _safeMint(to, tokenId);

        emit TokenMinted(tokenId, to, name);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        TokenData memory d = _tokenData[tokenId];

        // Both: return on-chain JSON that also references IPFS
        if (bytes(d.name).length > 0 && bytes(d.uri).length > 0) {
            return _buildOnChainURI(tokenId, d, true);
        }

        // On-chain only
        if (bytes(d.name).length > 0) {
            return _buildOnChainURI(tokenId, d, false);
        }

        // IPFS only
        if (bytes(d.uri).length > 0) {
            return d.uri;
        }

        revert("Token has no metadata");
    }

    function _buildOnChainURI(
        uint256 tokenId,
        TokenData memory d,
        bool hasUri
    ) internal view returns (string memory) {
        string memory name = _escapeJson(d.name);
        string memory desc = _escapeJson(d.description);
        string memory svg = _buildSVG(name);

        // Build JSON
        bytes memory json = abi.encodePacked(
            'data:application/json,',
            '{"name":"', name, '",',
            '"description":"', desc, '",',
            '"image":"data:image/svg+xml,', svg, '"',
            hasUri
                ? abi.encodePacked(
                    ',"external_url":"', d.uri, '"',
                    ',"animation_url":"', d.uri, '"'
                  )
                : bytes(""),
            ',"attributes":[',
            '{"trait_type":"Series","value":"Chain Garden"},',
            '{"trait_type":"Token","value":"', _uint2str(tokenId), '"}',
            ']}'
        );

        return string(json);
    }

    function _buildSVG(string memory name) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E',
            '%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E',
            '%3Cstop offset=%220%22 stop-color=%22%23050510%22/%3E',
            '%3Cstop offset=%22100%22 stop-color=%22%230a0a1a%22/%3E',
            '%3C/linearGradient%3E%3C/defs%3E',
            '%3Crect width=%22400%22 height=%22400%22 fill=%22url(%23g)%22/%3E',
            '%3Ctext x=%22200%22 y=%22180%22 text-anchor=%22middle%22 fill=%22%23c8b48c%22 font-family=%22serif%22 font-size=%2224%22%3EE2%9C%A6%3C/text%3E',
            '%3Ctext x=%22200%22 y=%22220%22 text-anchor=%22middle%22 fill=%22%23c8b48c%22 font-family=%22serif%22 font-size=%2216%22%3E', _encodeSVGText(name), '%3C/text%3E',
            '%3Ctext x=%22200%22 y=%22260%22 text-anchor=%22middle%22 fill=%22%234ecdc4%22 font-family=%22monospace%22 font-size=%2211%22%3EChain%20Garden%3C/text%3E',
            '%3C/svg%3E'
        ));
    }

    function _encodeSVGText(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = new bytes(b.length * 3);
        uint256 j;
        for (uint256 i; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == 0x20) { out[j] = '%'; out[j+1] = '2'; out[j+2] = '0'; j += 3; }
            else if (c == '&') { out[j] = '%'; out[j+1] = '2'; out[j+2] = '6'; j += 3; }
            else if (c == '<') { out[j] = '%'; out[j+1] = '3'; out[j+2] = 'C'; j += 3; }
            else if (c == '>') { out[j] = '%'; out[j+1] = '3'; out[j+2] = 'E'; j += 3; }
            else if (c == '#') { out[j] = '%'; out[j+1] = '2'; out[j+2] = '3'; j += 3; }
            else { out[j] = c; j++; }
        }
        bytes memory trimmed = new bytes(j);
        for (uint256 k; k < j; k++) trimmed[k] = out[k];
        return string(trimmed);
    }

    function _escapeJson(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = new bytes(b.length * 2);
        uint256 j;
        for (uint256 i; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == '"') { out[j] = '\\'; out[j+1] = '"'; j += 2; }
            else if (c == '\\') { out[j] = '\\'; out[j+1] = '\\'; j += 2; }
            else if (c == '\n') { out[j] = '\\'; out[j+1] = 'n'; j += 2; }
            else { out[j] = c; j++; }
        }
        bytes memory trimmed = new bytes(j);
        for (uint256 k; k < j; k++) trimmed[k] = out[k];
        return string(trimmed);
    }

    function _uint2str(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory b = new bytes(digits);
        while (v != 0) { b[--digits] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(b);
    }

    function getTokenData(uint256 tokenId) external view returns (TokenData memory) {
        _requireOwned(tokenId);
        return _tokenData[tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
