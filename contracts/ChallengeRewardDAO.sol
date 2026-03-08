// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChallengeRewardDAO {
    struct Challenge {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 rewardAmount;
        string escrowTxHash;
        uint256 votingDuration;
        bool active;
        uint256 createdAt;
    }

    struct Submission {
        uint256 id;
        uint256 challengeId;
        address submitter;
        string evidenceUrl;
        string xrplAddress;
        uint256 submittedAt;
        uint256 votingDeadline;
        SubmissionStatus status;
        uint256 approveVotes;
        uint256 denyVotes;
        bool finalized;
    }

    enum SubmissionStatus { Pending, Approved, Denied }

    address public owner;
    uint256 public challengeCount;
    uint256 public submissionCount;

    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => Submission) public submissions;
    mapping(address => bool) public isDaoMember;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ChallengeCreated(uint256 indexed challengeId, string title, uint256 rewardAmount, string escrowTxHash);
    event SubmissionCreated(uint256 indexed submissionId, uint256 indexed challengeId, address submitter);
    event VoteCast(uint256 indexed submissionId, address voter, bool approve);
    event SubmissionFinalized(uint256 indexed submissionId, uint8 status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyDaoMember() {
        require(isDaoMember[msg.sender], "Not a DAO member");
        _;
    }

    constructor() {
        owner = msg.sender;
        isDaoMember[msg.sender] = true;
    }

    function addDaoMember(address member) external onlyOwner {
        isDaoMember[member] = true;
    }

    function removeDaoMember(address member) external onlyOwner {
        isDaoMember[member] = false;
    }

    function createChallenge(
        string calldata title,
        string calldata description,
        uint256 rewardAmount,
        string calldata escrowTxHash,
        uint256 votingDuration
    ) external returns (uint256) {
        challengeCount++;
        challenges[challengeCount] = Challenge({
            id: challengeCount,
            title: title,
            description: description,
            creator: msg.sender,
            rewardAmount: rewardAmount,
            escrowTxHash: escrowTxHash,
            votingDuration: votingDuration,
            active: true,
            createdAt: block.timestamp
        });

        emit ChallengeCreated(challengeCount, title, rewardAmount, escrowTxHash);
        return challengeCount;
    }

    function submitEvidence(
        uint256 challengeId,
        string calldata evidenceUrl,
        string calldata xrplAddress
    ) external returns (uint256) {
        require(challengeId > 0 && challengeId <= challengeCount, "Invalid challenge");
        require(challenges[challengeId].active, "Challenge not active");

        submissionCount++;
        submissions[submissionCount] = Submission({
            id: submissionCount,
            challengeId: challengeId,
            submitter: msg.sender,
            evidenceUrl: evidenceUrl,
            xrplAddress: xrplAddress,
            submittedAt: block.timestamp,
            votingDeadline: block.timestamp + challenges[challengeId].votingDuration,
            status: SubmissionStatus.Pending,
            approveVotes: 0,
            denyVotes: 0,
            finalized: false
        });

        emit SubmissionCreated(submissionCount, challengeId, msg.sender);
        return submissionCount;
    }

    function vote(uint256 submissionId, bool approve) external onlyDaoMember {
        Submission storage sub = submissions[submissionId];
        require(sub.id > 0, "Invalid submission");
        require(!sub.finalized, "Already finalized");
        require(block.timestamp <= sub.votingDeadline, "Voting ended");
        require(!hasVoted[submissionId][msg.sender], "Already voted");

        hasVoted[submissionId][msg.sender] = true;

        if (approve) {
            sub.approveVotes++;
        } else {
            sub.denyVotes++;
        }

        emit VoteCast(submissionId, msg.sender, approve);
    }

    function finalizeSubmission(uint256 submissionId) external {
        Submission storage sub = submissions[submissionId];
        require(sub.id > 0, "Invalid submission");
        require(!sub.finalized, "Already finalized");
        require(block.timestamp > sub.votingDeadline, "Voting not ended");

        sub.finalized = true;

        if (sub.approveVotes > sub.denyVotes) {
            sub.status = SubmissionStatus.Approved;
        } else {
            sub.status = SubmissionStatus.Denied;
        }

        emit SubmissionFinalized(submissionId, uint8(sub.status));
    }
}
