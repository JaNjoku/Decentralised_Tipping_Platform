# Tip-Stacks: Decentralized Tipping Platform

A comprehensive blockchain-based tipping platform built on Stacks, enabling instant, transparent, and rewarding peer-to-peer value transfer with advanced features including user identity management, reward systems, and multi-token support.

## Overview

Tip-Stacks revolutionizes digital tipping by creating a trustless, transparent platform where content creators, service providers, and community members can receive appreciation through cryptocurrency tips. The platform features automatic reward distribution, identity verification, and comprehensive analytics to foster a thriving creator economy.

## Key Features

### 💰 Advanced Tipping System

- **Multi-Token Support**: Accept tips in STX and BTC
- **Flexible Amounts**: Support for any tip amount up to 1,000 STX
- **Instant Transfers**: Direct peer-to-peer value transfer
- **Platform Sustainability**: 5% platform fee for ecosystem maintenance

### 🏆 Reward Points System

- **Threshold-Based Rewards**: Earn 10 points for tips ≥ 1 STX
- **Cumulative Tracking**: Build long-term reputation through consistent tipping
- **Admin Controls**: Platform owner can manually adjust reward points
- **Gamification**: Encourage engagement through point accumulation

### 👤 Identity Management

- **Username Registration**: Unique 3-20 character usernames
- **Verification System**: Verified user status for enhanced trust
- **Username Protection**: Prevent duplicate registrations
- **Self-Sovereign Identity**: Users control their own identity setup

### 📊 Comprehensive Analytics

- **Tip Tracking**: Complete history of sent and received tips
- **Statistical Dashboard**: Total amounts, transaction counts, reward points
- **Platform Fees**: Transparent fee calculation and distribution
- **User Profiles**: Detailed statistics for reputation building

### 🛡️ Security & Validation

- **Input Validation**: Comprehensive checks for all parameters
- **Access Controls**: Role-based permissions for sensitive functions
- **Anti-Abuse Protection**: Prevent self-tipping and invalid recipients
- **Safe Transfers**: Secure STX transfer mechanisms with error handling

## Core Functions

### Basic Tipping

```clarity
;; Send tip to recipient
(contract-call? .tipping_platform tip
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7  ;; recipient
    u5000000                                        ;; 5 STX
    "STX")                                         ;; token type

;; Check user's tipping statistics
(contract-call? .tipping_platform get-user-tip-stats
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7)
```

### Identity Management

```clarity
;; Register username
(contract-call? .tipping_platform set-user-identity
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7  ;; user principal
    "alice_creator")                              ;; username

;; Get user identity
(contract-call? .tipping_platform get-user-identity
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7)
```

### Admin Functions

```clarity
;; Update user reward points (owner only)
(contract-call? .tipping_platform update-user-reward-points
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7  ;; user
    u50)                                          ;; additional points
```

## Platform Economics

### Fee Structure

- **Platform Fee**: 5% of each tip amount
- **Fee Distribution**: All fees go to platform owner for maintenance
- **Transparent Calculation**: Public fee calculation functions
- **Creator Revenue**: 95% of tip amount goes directly to recipient

### Reward System

- **Reward Threshold**: Tips ≥ 1 STX (1,000,000 µSTX) earn rewards
- **Reward Rate**: 10 points per qualifying tip
- **Maximum Rate**: Admin updates capped at 100 points per transaction
- **Accumulation**: Points accumulate across all tipping activity

### Supported Tokens

| Token   | Symbol | Status    |
| ------- | ------ | --------- |
| Stacks  | STX    | ✅ Active |
| Bitcoin | BTC    | ✅ Active |

## Smart Contract Architecture

### Data Structures

#### User Analytics

```clarity
;; Get complete user statistics
get-user-tip-stats(user) → {total-tips-sent, total-tips-received, reward-points}

;; Get individual metrics
get-total-tips-sent(user) → uint
get-total-tips-received(user) → uint

;; Calculate potential rewards
get-reward-points(user, amount) → uint
```

### Identity & Validation

```clarity
;; Get user identity information
get-user-identity(user) → {username, verified}

;; Validate tip amounts
get-tip-amount(amount) → boolean

;; Calculate net tip after fees
get-tips-recieved(recipient, amount) → uint
```

### Platform Statistics

```clarity
;; Get transaction history
get-transaction-logs(sender, recipient, amount, fee, token-type) → transaction-data

;; Get updated platform stats simulation
get-updated-platform-stats(sender, amount) → simulated-stats
```

## Use Cases

### Content Creators

- **Live Streaming**: Real-time tip reception during streams
- **Social Media**: Appreciation for posts, videos, and content
- **Educational Content**: Tips for tutorials, courses, and guides
- **Art & Design**: Support for digital artists and designers

### Service Providers

- **Freelancers**: Additional compensation for excellent work
- **Customer Service**: Recognition for exceptional support
- **Community Moderators**: Appreciation for maintaining communities
- **Open Source Developers**: Support for valuable contributions

### Community Building

- **Discord Communities**: Tip active members and contributors
- **Gaming Communities**: Reward skilled players and helpers
- **Learning Communities**: Appreciate mentors and knowledge sharers
- **Creator Communities**: Cross-support between creators

### Business Applications

- **Customer Appreciation**: Businesses can tip loyal customers
- **Employee Recognition**: Internal appreciation and bonus system
- **Supplier Relations**: Appreciation for exceptional service
- **Community Engagement**: Brand engagement through tipping

## API Reference

### Core Tipping Functions

#### `tip(recipient, amount, token-type)`

Send a tip to another user with automatic fee calculation.

**Parameters:**

- `recipient`: Principal address of tip recipient
- `amount`: Tip amount in µSTX (includes platform fee)
- `token-type`: "STX" or "BTC"

**Returns:** `(response bool uint)`

**Errors:**

- `ERR_INVALID_RECIPIENT` (u5): Invalid recipient address
- `ERR_INVALID_AMOUNT` (u2): Invalid tip amount
- `ERR_INVALID_TOKEN_TYPE` (u11): Unsupported token type
- `ERR_TRANSFER_FAILED` (u3): Transfer operation failed

#### `set-user-identity(user, username)`

Register a unique username for a user account.

**Parameters:**

- `user`: Principal address (must be tx-sender)
- `username`: Unique username (3-20 characters)

**Returns:** `(response bool uint)`

**Errors:**

- `ERR_UNAUTHORIZED` (u6): Not authorized to set identity
- `ERR_INVALID_USERNAME` (u8): Empty username
- `ERR_INVALID_USERNAME_LENGTH` (u9): Invalid length
- `ERR_USERNAME_TAKEN` (u10): Username already registered

#### `update-user-reward-points(user, reward-rate)`

Manually update user reward points (owner only).

**Parameters:**

- `user`: Principal address of user
- `reward-rate`: Points to add (max 100)

**Returns:** `(response bool uint)`

**Errors:**

- `ERR_UNAUTHORIZED` (u6): Not contract owner
- `ERR_INVALID_USER` (u12): Invalid user principal
- `ERR_INVALID_REWARD_RATE` (u7): Rate exceeds maximum
- `ERR_REWARD_UPDATE_FAILED` (u4): Update operation failed

## Error Codes Reference

| Code | Constant                    | Description                                    |
| ---- | --------------------------- | ---------------------------------------------- |
| u1   | ERR_INSUFFICIENT_FUNDS      | Sender lacks sufficient balance                |
| u2   | ERR_INVALID_AMOUNT          | Tip amount invalid (0, negative, or >1000 STX) |
| u3   | ERR_TRANSFER_FAILED         | STX transfer operation failed                  |
| u4   | ERR_REWARD_UPDATE_FAILED    | Reward point update failed                     |
| u5   | ERR_INVALID_RECIPIENT       | Cannot tip self or contract owner              |
| u6   | ERR_UNAUTHORIZED            | Function restricted to specific users          |
| u7   | ERR_INVALID_REWARD_RATE     | Reward rate exceeds maximum (100)              |
| u8   | ERR_INVALID_USERNAME        | Username is empty                              |
| u9   | ERR_INVALID_USERNAME_LENGTH | Username not 3-20 characters                   |
| u10  | ERR_USERNAME_TAKEN          | Username already registered                    |
| u11  | ERR_INVALID_TOKEN_TYPE      | Token type not supported                       |
| u12  | ERR_INVALID_USER            | Invalid user principal address                 |

## Integration Examples

### Frontend Integration

```javascript
// Send tip using Stacks.js
const tipTransaction = {
  contractAddress: "SP123...",
  contractName: "tipping_platform",
  functionName: "tip",
  functionArgs: [
    principalCV("SP456..."), // recipient
    uintCV(5000000), // 5 STX
    stringAsciiCV("STX"), // token type
  ],
};

await openContractCall(tipTransaction);
```

### Mobile App Integration

```javascript
// Get user statistics
const getUserStats = async (userAddress) => {
  const result = await callReadOnlyFunction({
    contractAddress: contractAddress,
    contractName: "tipping_platform",
    functionName: "get-user-tip-stats",
    functionArgs: [principalCV(userAddress)],
  });

  return result;
};
```

### Analytics Dashboard

```javascript
// Calculate platform metrics
const calculateMetrics = async (users) => {
  const metrics = {
    totalTipsSent: 0,
    totalTipsReceived: 0,
    totalRewardPoints: 0,
    activeUsers: 0,
  };

  for (const user of users) {
    const stats = await getUserStats(user);
    metrics.totalTipsSent += stats.totalTipsSent;
    metrics.totalTipsReceived += stats.totalTipsReceived;
    metrics.totalRewardPoints += stats.rewardPoints;
    if (stats.totalTipsSent > 0 || stats.totalTipsReceived > 0) {
      metrics.activeUsers++;
    }
  }

  return metrics;
};
```

## Development Setup

### Prerequisites

- **Clarinet**: Stacks development environment
- **Node.js**: For frontend integration
- **Stacks Wallet**: For testing transactions

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/tip-stacks.git
cd tip-stacks

# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/download/v1.5.4/clarinet-linux-x64.tar.gz | tar xz
sudo mv clarinet /usr/local/bin

# Run tests
clarinet test
```

### Testing

```bash
# Run comprehensive test suite
clarinet test

# Run specific test
clarinet test --filter "basic tipping functionality"

# Check contract syntax
clarinet check
```

### Deployment

```bash
# Deploy to testnet
clarinet publish --testnet

# Deploy to mainnet
clarinet publish --mainnet
```

## Platform Constants

### Economic Parameters

- **PLATFORM_FEE_PERCENTAGE**: 5%
- **MAX_TIP_AMOUNT**: 1,000 STX
- **REWARD_THRESHOLD**: 1 STX
- **REWARD_RATE**: 10 points
- **MAX_REWARD_RATE**: 100 points

### Supported Tokens

- **STX**: Native Stacks token
- **BTC**: Bitcoin support

### Username Constraints

- **Minimum Length**: 3 characters
- **Maximum Length**: 20 characters
- **Uniqueness**: Platform-wide unique usernames

## Security Considerations

### Smart Contract Security

- **Access Control**: Function-level authorization
- **Input Validation**: Comprehensive parameter checking
- **Safe Arithmetic**: Overflow protection throughout
- **Error Handling**: Graceful failure with informative errors

### Economic Security

- **Fee Transparency**: Public fee calculation
- **Transfer Safety**: Atomic transaction processing
- **Balance Verification**: Pre-transfer balance checks
- **Amount Limits**: Maximum tip amounts prevent abuse

### User Security

- **Identity Protection**: Self-sovereign username registration
- **Privacy**: Minimal data collection
- **Transparency**: Public transaction history
- **Reversibility**: No transaction reversibility (by design)

## Future Enhancements

### Planned Features

- **Multi-Token Expansion**: Support for more SIP-010 tokens
- **Subscription Tipping**: Recurring tip automation
- **Group Tipping**: Split tips among multiple recipients
- **NFT Rewards**: Special rewards for milestone achievements

### Community Features

- **Reputation System**: Long-term contributor recognition
- **Leaderboards**: Top tippers and recipients
- **Social Features**: Comments and tip messages
- **Integration APIs**: Third-party platform connections

### Platform Improvements

- **Gas Optimization**: Reduced transaction costs
- **Batch Operations**: Multiple tips in single transaction
- **Advanced Analytics**: Detailed platform metrics
- **Mobile SDK**: Native mobile app development tools

## License

MIT License

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- **Code Standards**: Follow Clarity best practices
- **Testing Requirements**: Maintain >95% test coverage
- **Documentation**: Update docs for all changes
- **Security**: Report vulnerabilities privately

## Support

- **Documentation**: Comprehensive guides and examples
- **Community**: Discord and Telegram support channels
- **GitHub Issues**: Bug reports and feature requests
- **Developer Support**: Technical integration assistance

---

**Tip-Stacks** - Empowering creators and communities through decentralized value appreciation! 🚀💫 Statistics

```clarity
user-tip-stats: {
    total-tips-sent: uint,
    total-tips-received: uint,
    reward-points: uint
}
```

#### Transaction History

```clarity
tip-history: {
    sender: principal,
    recipient: principal,
    timestamp: uint
} -> {
    amount: uint,
    fee: uint,
    token-type: string-ascii
}
```

#### User Identity

```clarity
user-identity: {
    username: string-ascii,
    verified: bool
}
```

### Validation Rules

#### Tip Amount Validation

- **Minimum**: Greater than 0
- **Maximum**: 1,000 STX (1,000,000,000 µSTX)
- **Balance Check**: Sender must have sufficient balance
- **Fee Inclusion**: Total amount includes platform fee

#### Recipient Validation

- **No Self-Tipping**: Cannot tip yourself
- **No Owner Tipping**: Cannot tip contract owner
- **Valid Principal**: Must be valid Stacks address

#### Username Validation

- **Length**: 3-20 characters
- **Uniqueness**: No duplicate usernames allowed
- **Authorization**: Only user can set their own username
- **Non-Empty**: Cannot register empty usernames

## Security Model

### Access Control Matrix

| Function                    | User | Owner | Description                  |
| --------------------------- | ---- | ----- | ---------------------------- |
| `tip`                       | ✅   | ✅    | Send tips to other users     |
| `set-user-identity`         | ✅\* | ✅\*  | Set own username only        |
| `update-user-reward-points` | ❌   | ✅    | Admin-only reward management |

\*Self-only: Users can only modify their own data

### Security Features

- **Input Sanitization**: All parameters validated before processing
- **Overflow Protection**: Safe arithmetic operations throughout
- **Access Controls**: Function-level authorization checks
- **Error Handling**: Comprehensive error codes and messages

### Anti-Abuse Mechanisms

- **Self-Tip Prevention**: Cannot tip yourself
- **Owner Tip Prevention**: Cannot tip contract owner for fee manipulation
- **Amount Limits**: Maximum tip amounts prevent excessive transactions
- **Username Protection**: Unique username registry prevents impersonation

## Read-Only Functions

### User
