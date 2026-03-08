// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract InsuranceWellnessDAO {
    address public owner;
    uint256 public nextCaseId;
    uint256 public minVotingPeriod = 1 days;

    enum CaseStatus {
        Pending,
        Approved,
        Denied
    }

    enum WellnessTier {
        HighRisk,
        Standard,
        Improved,
        Premium
    }

    struct WellnessCase {
        uint256 id;
        address applicant;
        string evidenceURI;
        bytes32 proofHash;
        string summary;
        uint256 wellnessScore;
        uint256 currentPremium;
        uint256 proposedPremium;
        WellnessTier requestedTier;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 approveVotes;
        uint256 denyVotes;
        bool finalized;
        CaseStatus status;
    }

    mapping(address => bool) public isMember;
    mapping(uint256 => WellnessCase) public wellnessCases;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    event WellnessCaseCreated(
        uint256 indexed caseId,
        address indexed applicant,
        uint256 wellnessScore,
        WellnessTier requestedTier,
        uint256 currentPremium,
        uint256 proposedPremium,
        uint256 votingDeadline
    );

    event VoteCast(
        uint256 indexed caseId,
        address indexed voter,
        bool approve
    );

    event WellnessCaseFinalized(
        uint256 indexed caseId,
        address indexed applicant,
        CaseStatus status,
        uint256 finalPremium,
        WellnessTier finalTier
    );

    event RebateApprovedForEscrow(
        uint256 indexed caseId,
        address indexed applicant,
        uint256 rebateAmount,
        uint256 approvedPremium
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "Not DAO member");
        _;
    }

    modifier caseExists(uint256 caseId) {
        require(caseId < nextCaseId, "Case does not exist");
        _;
    }

    constructor(address[] memory initialMembers) {
        owner = msg.sender;
        isMember[msg.sender] = true;
        emit MemberAdded(msg.sender);

        for (uint256 i = 0; i < initialMembers.length; i++) {
            if (!isMember[initialMembers[i]] && initialMembers[i] != address(0)) {
                isMember[initialMembers[i]] = true;
                emit MemberAdded(initialMembers[i]);
            }
        }
    }

    function addMember(address member) external onlyOwner {
        require(member != address(0), "Zero address");
        require(!isMember[member], "Already member");
        isMember[member] = true;
        emit MemberAdded(member);
    }

    function removeMember(address member) external onlyOwner {
        require(isMember[member], "Not member");
        isMember[member] = false;
        emit MemberRemoved(member);
    }

    function setMinVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 hours, "Too short");
        minVotingPeriod = newPeriod;
    }

    function createWellnessCase(
        string calldata evidenceURI,
        bytes32 proofHash,
        string calldata summary,
        uint256 wellnessScore,
        uint256 votingPeriod
    ) external returns (uint256 caseId) {
        require(bytes(evidenceURI).length > 0, "Evidence URI required");
        require(bytes(summary).length > 0, "Summary required");
        require(wellnessScore <= 100, "Score must be 0-100");
        require(votingPeriod >= minVotingPeriod, "Voting period too short");

        WellnessTier requestedTier = _tierFromScore(wellnessScore);
        uint256 currentPremium = 200;
        uint256 proposedPremium = _premiumFromTier(requestedTier);

        caseId = nextCaseId++;

        wellnessCases[caseId] = WellnessCase({
            id: caseId,
            applicant: msg.sender,
            evidenceURI: evidenceURI,
            proofHash: proofHash,
            summary: summary,
            wellnessScore: wellnessScore,
            currentPremium: currentPremium,
            proposedPremium: proposedPremium,
            requestedTier: requestedTier,
            createdAt: block.timestamp,
            votingDeadline: block.timestamp + votingPeriod,
            approveVotes: 0,
            denyVotes: 0,
            finalized: false,
            status: CaseStatus.Pending
        });

        emit WellnessCaseCreated(
            caseId,
            msg.sender,
            wellnessScore,
            requestedTier,
            currentPremium,
            proposedPremium,
            block.timestamp + votingPeriod
        );
    }

    function voteOnCase(uint256 caseId, bool approve)
        external
        onlyMember
        caseExists(caseId)
    {
        WellnessCase storage c = wellnessCases[caseId];
        require(!c.finalized, "Case already finalized");
        require(block.timestamp < c.votingDeadline, "Voting ended");
        require(!hasVoted[caseId][msg.sender], "Already voted");

        hasVoted[caseId][msg.sender] = true;

        if (approve) {
            c.approveVotes += 1;
        } else {
            c.denyVotes += 1;
        }

        emit VoteCast(caseId, msg.sender, approve);
    }

    function finalizeCase(uint256 caseId)
        external
        caseExists(caseId)
    {
        WellnessCase storage c = wellnessCases[caseId];
        require(!c.finalized, "Already finalized");
        require(block.timestamp >= c.votingDeadline, "Voting still active");

        c.finalized = true;

        WellnessTier finalTier;
        uint256 finalPremium;

        if (c.approveVotes > c.denyVotes) {
            c.status = CaseStatus.Approved;
            finalTier = c.requestedTier;
            finalPremium = c.proposedPremium;

            uint256 rebateAmount = _calculateRebate(c.currentPremium, c.proposedPremium);

            emit WellnessCaseFinalized(caseId, c.applicant, c.status, finalPremium, finalTier);
            emit RebateApprovedForEscrow(caseId, c.applicant, rebateAmount, finalPremium);
        } else {
            c.status = CaseStatus.Denied;
            finalTier = WellnessTier.Standard;
            finalPremium = c.currentPremium;

            emit WellnessCaseFinalized(caseId, c.applicant, c.status, finalPremium, finalTier);
        }
    }

    function getWellnessCase(uint256 caseId)
        external
        view
        caseExists(caseId)
        returns (WellnessCase memory)
    {
        return wellnessCases[caseId];
    }

    function didVote(uint256 caseId, address voter)
        external
        view
        caseExists(caseId)
        returns (bool)
    {
        return hasVoted[caseId][voter];
    }

    function previewScoreOutcome(uint256 wellnessScore)
        external
        pure
        returns (WellnessTier tier, uint256 premium)
    {
        require(wellnessScore <= 100, "Score must be 0-100");
        tier = _tierFromScore(wellnessScore);
        premium = _premiumFromTier(tier);
    }

    function _tierFromScore(uint256 score) internal pure returns (WellnessTier) {
        if (score >= 85) return WellnessTier.Premium;
        else if (score >= 70) return WellnessTier.Improved;
        else if (score >= 50) return WellnessTier.Standard;
        else return WellnessTier.HighRisk;
    }

    function _premiumFromTier(WellnessTier tier) internal pure returns (uint256) {
        if (tier == WellnessTier.Premium) return 150;
        else if (tier == WellnessTier.Improved) return 175;
        else if (tier == WellnessTier.Standard) return 200;
        else return 220;
    }

    function _calculateRebate(uint256 currentPremium, uint256 approvedPremium) internal pure returns (uint256) {
        if (approvedPremium >= currentPremium) return 0;
        uint256 monthlySavings = currentPremium - approvedPremium;
        return monthlySavings * 12;
    }
}
