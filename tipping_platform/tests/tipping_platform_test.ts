import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that basic tipping functionality works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1000000), // 1 STX
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify sender stats updated
        let senderStats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet1.address)],
            deployer.address
        );
        
        let stats = senderStats.result.expectTuple();
        assertEquals(stats['total-tips-sent'], types.uint(1000000));
        
        // Verify recipient stats updated (amount minus 5% platform fee)
        let recipientStats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet2.address)],
            deployer.address
        );
        
        let recStats = recipientStats.result.expectTuple();
        assertEquals(recStats['total-tips-received'], types.uint(950000)); // 1 STX - 5% fee
    },
});

Clarinet.test({
    name: "Ensure that invalid tip amounts are rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Test tipping amount larger than max allowed (1000 STX)
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1001000000000), // 1001 STX (over limit)
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(2)); // ERR_INVALID_AMOUNT
        
        // Test tipping zero amount
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(0),
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(2)); // ERR_INVALID_AMOUNT
    },
});

Clarinet.test({
    name: "Ensure that invalid recipients are rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Test tipping to self
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet1.address), // Self
                types.uint(1000000),
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(5)); // ERR_INVALID_RECIPIENT
        
        // Test tipping to contract owner
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(deployer.address), // Contract owner
                types.uint(1000000),
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(5)); // ERR_INVALID_RECIPIENT
    },
});

Clarinet.test({
    name: "Ensure that invalid token types are rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1000000),
                types.ascii("ETH") // Invalid token type
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(11)); // ERR_INVALID_TOKEN_TYPE
    },
});

Clarinet.test({
    name: "Ensure that platform fee calculation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Get initial balance of contract owner (platform fee recipient)
        let initialOwnerBalance = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(deployer.address)],
            deployer.address
        );
        
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(10000000), // 10 STX
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify recipient received 95% (10 STX - 5% = 9.5 STX)
        let recipientStats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet2.address)],
            deployer.address
        );
        
        let recStats = recipientStats.result.expectTuple();
        assertEquals(recStats['total-tips-received'], types.uint(9500000)); // 9.5 STX
    },
});

Clarinet.test({
    name: "Ensure that reward points system works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Tip above reward threshold (1 STX)
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(2000000), // 2 STX (above 1 STX threshold)
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Check reward points were added
        let senderStats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet1.address)],
            deployer.address
        );
        
        let stats = senderStats.result.expectTuple();
        assertEquals(stats['reward-points'], types.uint(10)); // REWARD_RATE = 10
        
        // Tip below reward threshold
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(500000), // 0.5 STX (below 1 STX threshold)
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        // Reward points should remain the same
        senderStats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet1.address)],
            deployer.address
        );
        
        stats = senderStats.result.expectTuple();
        assertEquals(stats['reward-points'], types.uint(10)); // Should still be 10
    },
});

Clarinet.test({
    name: "Ensure that user identity management works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Set valid username
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'set-user-identity', [
                types.principal(wallet1.address),
                types.ascii("alice123")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify identity was set
        let identity = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-identity',
            [types.principal(wallet1.address)],
            deployer.address
        );
        
        let userIdentity = identity.result.expectTuple();
        assertEquals(userIdentity.username, types.ascii("alice123"));
        assertEquals(userIdentity.verified, types.bool(true));
        
        // Try to set duplicate username
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'set-user-identity', [
                types.principal(wallet2.address),
                types.ascii("alice123") // Same username
            ], wallet2.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(10)); // ERR_USERNAME_TAKEN
    },
});

Clarinet.test({
    name: "Ensure that username validation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        
        // Test empty username
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'set-user-identity', [
                types.principal(wallet1.address),
                types.ascii("")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(8)); // ERR_INVALID_USERNAME
        
        // Test username too short (less than 3 characters)
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'set-user-identity', [
                types.principal(wallet1.address),
                types.ascii("ab")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(9)); // ERR_INVALID_USERNAME_LENGTH
        
        // Test username too long (more than 20 characters)
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'set-user-identity', [
                types.principal(wallet1.address),
                types.ascii("verylongusernamethatexceedslimit")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(9)); // ERR_INVALID_USERNAME_LENGTH
    },
});

Clarinet.test({
    name: "Ensure that unauthorized identity setting is rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Try to set identity for another user
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'set-user-identity', [
                types.principal(wallet2.address), // Setting identity for wallet2
                types.ascii("malicious")
            ], wallet1.address) // But called by wallet1
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(6)); // ERR_UNAUTHORIZED
    },
});

Clarinet.test({
    name: "Ensure that owner can update user reward points",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // First, create some initial stats for wallet1 by making a tip
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1000000),
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        // Owner updates reward points
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'update-user-reward-points', [
                types.principal(wallet1.address),
                types.uint(50)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify reward points were updated
        let stats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet1.address)],
            deployer.address
        );
        
        let userStats = stats.result.expectTuple();
        assertEquals(userStats['reward-points'], types.uint(60)); // 10 (from tip) + 50 (manual update)
    },
});

Clarinet.test({
    name: "Ensure that non-owner cannot update reward points",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Non-owner tries to update reward points
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'update-user-reward-points', [
                types.principal(wallet2.address),
                types.uint(50)
            ], wallet1.address) // Non-owner
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(6)); // ERR_UNAUTHORIZED
    },
});

Clarinet.test({
    name: "Ensure that reward rate validation works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // First tip to create user stats
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1000000),
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        // Try to set reward rate above maximum (100)
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'update-user-reward-points', [
                types.principal(wallet1.address),
                types.uint(150) // Above MAX_REWARD_RATE (100)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(7)); // ERR_INVALID_REWARD_RATE
    },
});

Clarinet.test({
    name: "Ensure that read-only functions return correct values",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Make a tip first
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(5000000), // 5 STX
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        // Test get-total-tips-sent
        let totalSent = chain.callReadOnlyFn(
            'tipping_platform',
            'get-total-tips-sent',
            [types.principal(wallet1.address)],
            deployer.address
        );
        assertEquals(totalSent.result, types.uint(5000000));
        
        // Test get-total-tips-received
        let totalReceived = chain.callReadOnlyFn(
            'tipping_platform',
            'get-total-tips-received',
            [types.principal(wallet2.address)],
            deployer.address
        );
        assertEquals(totalReceived.result, types.uint(4750000)); // 5 STX - 5% fee
        
        // Test get-tips-recieved function
        let tipsReceived = chain.callReadOnlyFn(
            'tipping_platform',
            'get-tips-recieved',
            [types.principal(wallet2.address), types.uint(5000000)],
            deployer.address
        );
        assertEquals(tipsReceived.result, types.uint(4750000)); // 5 STX - 5% fee
        
        // Test get-reward-points
        let rewardPoints = chain.callReadOnlyFn(
            'tipping_platform',
            'get-reward-points',
            [types.principal(wallet1.address), types.uint(5000000)],
            deployer.address
        );
        assertEquals(rewardPoints.result, types.uint(20)); // 10 (existing) + 10 (new reward)
    },
});

Clarinet.test({
    name: "Ensure that multiple tips accumulate correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        let wallet3 = accounts.get('wallet_3')!;
        
        // Multiple tips from same sender
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(2000000), // 2 STX
                types.ascii("STX")
            ], wallet1.address),
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet3.address),
                types.uint(3000000), // 3 STX
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 2);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        assertEquals(block.receipts[1].result.expectOk(), types.bool(true));
        
        // Check accumulated stats
        let senderStats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet1.address)],
            deployer.address
        );
        
        let stats = senderStats.result.expectTuple();
        assertEquals(stats['total-tips-sent'], types.uint(5000000)); // 2 + 3 STX
        assertEquals(stats['reward-points'], types.uint(20)); // 10 + 10 (both above threshold)
        
        // Check wallet2 received correct amount
        let wallet2Stats = chain.callReadOnlyFn(
            'tipping_platform',
            'get-user-tip-stats',
            [types.principal(wallet2.address)],
            deployer.address
        );
        
        let w2Stats = wallet2Stats.result.expectTuple();
        assertEquals(w2Stats['total-tips-received'], types.uint(1900000)); // 2 STX - 5% fee
    },
});

Clarinet.test({
    name: "Ensure that tip amount validation function works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        // Test valid amount
        let validAmount = chain.callReadOnlyFn(
            'tipping_platform',
            'get-tip-amount',
            [types.uint(1000000)], // 1 STX
            deployer.address
        );
        assertEquals(validAmount.result, types.bool(true));
        
        // Test amount over limit
        let invalidAmount = chain.callReadOnlyFn(
            'tipping_platform',
            'get-tip-amount',
            [types.uint(1001000000000)], // Over 1000 STX limit
            deployer.address
        );
        assertEquals(invalidAmount.result, types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that both STX and BTC token types work",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        let wallet2 = accounts.get('wallet_2')!;
        
        // Test STX tip
        let block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1000000),
                types.ascii("STX")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Test BTC tip
        block = chain.mineBlock([
            Tx.contractCall('tipping_platform', 'tip', [
                types.principal(wallet2.address),
                types.uint(1000000),
                types.ascii("BTC")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    },
});