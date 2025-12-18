// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AfterLife {
    
    // --- State Variables ---

    address public owner;
    uint256 public inactivityThreshold;
    uint256 public lastHeartbeat;
    bool public isDead; // "Dead" or "Inactive" state confirmed

    struct Guardian {
        string name;
        address wallet;
        bool isFixed; // Cannot be removed easily
    }

    struct Beneficiary {
        string name;
        address wallet;
        uint256 allocation; // Percentage in Basis Points (10000 = 100%)
        uint256 amountClaimed;
        VestingType vestingType;
        uint256 vestingDuration; // Seconds
    }

    enum VestingType { LINEAR, CLIFF }

    mapping(address => Guardian) public guardians;
    address[] public guardianList;

    mapping(address => Beneficiary) public beneficiaries;
    address[] public beneficiaryList;

    uint256 public totalAllocation;
    uint256 public vestingStartTime; // Set when inactivity confirmed

    // --- Events ---
    event Pulse(uint256 timestamp);
    event InactivityConfirmed(uint256 timestamp);
    event BeneficiaryAdded(address indexed wallet, uint256 allocation);
    event GuardianAdded(address indexed wallet);
    event FundsClaimed(address indexed beneficiary, uint256 amount);
    event Deprecated(address indexed owner);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Not Owner");
        _;
    }

    modifier onlyGuardian() {
        require(guardians[msg.sender].wallet != address(0), "Not Guardian");
        _;
    }

    modifier onlyWhileExecuting() {
        require(isDead, "Protocol Active");
        require(vestingStartTime > 0, "Vesting Not Started");
        _;
    }

    constructor(uint256 _thresholdSeconds) {
        owner = msg.sender;
        lastHeartbeat = block.timestamp;
        inactivityThreshold = _thresholdSeconds;
    }

    // --- Owner Actions ---

    function proveLife() external onlyOwner {
        lastHeartbeat = block.timestamp;
        emit Pulse(block.timestamp);
    }

    function addGuardian(string memory _name, address _wallet) external onlyOwner {
        require(guardians[_wallet].wallet == address(0), "Exists");
        
        Guardian memory newGuardian = Guardian({
            name: _name,
            wallet: _wallet,
            isFixed: false
        });

        guardians[_wallet] = newGuardian;
        guardianList.push(_wallet);
        emit GuardianAdded(_wallet);
    }

    function addBeneficiary(
        string memory _name, 
        address _wallet, 
        uint256 _allocationBps, 
        VestingType _vestingType, 
        uint256 _duration
    ) external onlyOwner {
        require(beneficiaries[_wallet].wallet == address(0), "Exists");
        require(totalAllocation + _allocationBps <= 10000, "Over 100%");

        Beneficiary memory newB = Beneficiary({
            name: _name,
            wallet: _wallet,
            allocation: _allocationBps,
            amountClaimed: 0,
            vestingType: _vestingType,
            vestingDuration: _duration
        });

        beneficiaries[_wallet] = newB;
        beneficiaryList.push(_wallet);
        totalAllocation += _allocationBps;
        emit BeneficiaryAdded(_wallet, _allocationBps);
    }

    function removeGuardian(address _wallet) external onlyOwner {
        require(guardians[_wallet].wallet != address(0), "Not Found");
        require(!guardians[_wallet].isFixed, "Fixed");

        delete guardians[_wallet];

        // Remove from list
        for (uint i = 0; i < guardianList.length; i++) {
            if (guardianList[i] == _wallet) {
                guardianList[i] = guardianList[guardianList.length - 1];
                guardianList.pop();
                break;
            }
        }
    }

    function removeBeneficiary(address _wallet) external onlyOwner {
        require(beneficiaries[_wallet].wallet != address(0), "Not Found");

        uint256 allocation = beneficiaries[_wallet].allocation;
        totalAllocation -= allocation;
        
        delete beneficiaries[_wallet];

        // Remove from list
        for (uint i = 0; i < beneficiaryList.length; i++) {
            if (beneficiaryList[i] == _wallet) {
                beneficiaryList[i] = beneficiaryList[beneficiaryList.length - 1];
                beneficiaryList.pop();
                break;
            }
        }
    }

    uint256 public initialVaultBalance; // Balance at time of execution start

    // --- Guardian Actions ---

    function confirmInactivity() external onlyGuardian {
        require(!isDead, "Already Dead");
        require(block.timestamp > lastHeartbeat + inactivityThreshold, "Owner Active");
        
        isDead = true;
        vestingStartTime = block.timestamp;
        initialVaultBalance = address(this).balance; // SNAPSHOT
        
        emit InactivityConfirmed(block.timestamp);
    }

    // --- Beneficiary Actions ---

    function claim() external onlyWhileExecuting {
        Beneficiary storage b = beneficiaries[msg.sender];
        require(b.wallet == msg.sender, "Not Beneficiary");

        uint256 totalEntitlement = (initialVaultBalance * b.allocation) / 10000;
        uint256 vestedAmount = 0;

        uint256 elapsed = block.timestamp - vestingStartTime;
        
        if (b.vestingType == VestingType.CLIFF) {
            if (elapsed >= b.vestingDuration) {
                vestedAmount = totalEntitlement;
            } else {
                vestedAmount = 0;
            }
        } else {
            // LINEAR
            if (elapsed >= b.vestingDuration) {
                vestedAmount = totalEntitlement;
            } else {
                vestedAmount = (totalEntitlement * elapsed) / b.vestingDuration;
            }
        }

        uint256 claimable = 0;
        if (vestedAmount > b.amountClaimed) {
            claimable = vestedAmount - b.amountClaimed;
        }

        require(claimable > 0, "Nothing to claim");
        require(address(this).balance >= claimable, "Vault Insolvency");

        b.amountClaimed += claimable;
        payable(b.wallet).transfer(claimable);
        
        emit FundsClaimed(b.wallet, claimable);
    }
    
    function _calculateAlreadyDistributed() internal view returns (uint256) {
        // Helper if needed, unused in Snapshot pattern
        return 0;
    }
    }

