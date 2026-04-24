#[cfg(test)]
mod tests {
    use crate::{ID as PROGRAM_ID, CampaignStatus};
    use litesvm::LiteSVM;
    use solana_sdk::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        system_program,
        transaction::Transaction,
    };

    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

    fn disc(name: &str) -> [u8; 8] {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        // Anchor discriminator = sha256("global:<name>")[0..8]
        // We hard-code the known values for the test instructions:
        match name {
            "initialize" => [175, 175, 109, 31, 13, 152, 155, 237],
            "create_profile" => [107, 42, 204, 152, 253, 216, 53, 109],
            "create_campaign" => [14, 142, 142, 184, 197, 74, 204, 175],
            "pledge" => [165, 252, 44, 55, 227, 221, 220, 183],
            _ => {
                let mut h = DefaultHasher::new();
                name.hash(&mut h);
                let v = h.finish().to_le_bytes();
                [v[0],v[1],v[2],v[3],v[4],v[5],v[6],v[7]]
            }
        }
    }

    fn global_state_pda() -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"global_state"], &PROGRAM_ID)
    }
    fn profile_pda(owner: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"creator_profile", owner.as_ref()], &PROGRAM_ID)
    }
    fn campaign_pda(creator: &Pubkey, id: u64) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"campaign", creator.as_ref(), &id.to_le_bytes()], &PROGRAM_ID)
    }
    fn vault_pda(campaign: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"campaign_vault", campaign.as_ref()], &PROGRAM_ID)
    }
    fn contribution_pda(campaign: &Pubkey, backer: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"contribution", campaign.as_ref(), backer.as_ref()], &PROGRAM_ID)
    }

    fn setup() -> (LiteSVM, Keypair) {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/kindling.so");
        svm.add_program(PROGRAM_ID, program_bytes);
        let admin = Keypair::new();
        svm.airdrop(&admin.pubkey(), 100 * LAMPORTS_PER_SOL).unwrap();
        (svm, admin)
    }

    fn init_platform(svm: &mut LiteSVM, admin: &Keypair) -> Pubkey {
        let (global_state, _) = global_state_pda();
        let data = disc("initialize").to_vec();
        let ix = Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(admin.pubkey(), true),
                AccountMeta::new(global_state, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        };
        let tx = Transaction::new_signed_with_payer(
            &[ix], Some(&admin.pubkey()), &[admin], svm.latest_blockhash(),
        );
        svm.send_transaction(tx).expect("initialize should succeed");
        global_state
    }

    #[test]
    fn test_initialize() {
        let (mut svm, admin) = setup();
        let gs = init_platform(&mut svm, &admin);
        assert!(svm.get_account(&gs).is_some(), "GlobalState should exist");
    }

    #[test]
    fn test_create_profile() {
        let (mut svm, admin) = setup();
        init_platform(&mut svm, &admin);
        let (profile, _) = profile_pda(&admin.pubkey());

        let name = "Alice";
        let bio = "Builder";
        let avatar = "";
        let twitter = "@alice";

        let mut data = disc("create_profile").to_vec();
        // AnchorSerialize: string = 4-byte LE length + bytes
        for s in &[name, bio, avatar, twitter] {
            let b = s.as_bytes();
            data.extend_from_slice(&(b.len() as u32).to_le_bytes());
            data.extend_from_slice(b);
        }

        let ix = Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(admin.pubkey(), true),
                AccountMeta::new(profile, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        };
        let tx = Transaction::new_signed_with_payer(
            &[ix], Some(&admin.pubkey()), &[&admin], svm.latest_blockhash(),
        );
        svm.send_transaction(tx).expect("create_profile should succeed");
        assert!(svm.get_account(&profile).is_some(), "Profile should exist");
    }

    #[test]
    fn test_create_campaign_validation() {
        let (mut svm, admin) = setup();
        let (global_state, _) = global_state_pda();
        init_platform(&mut svm, &admin);
        let (campaign, _) = campaign_pda(&admin.pubkey(), 0);
        let (vault, _) = vault_pda(&campaign);

        // Goal below minimum (0.05 SOL) should fail
        let mut data = disc("create_campaign").to_vec();
        for s in &["Test Campaign", "Description", "https://img.com/x.png"] {
            let b = s.as_bytes();
            data.extend_from_slice(&(b.len() as u32).to_le_bytes());
            data.extend_from_slice(b);
        }
        data.push(0u8); // category = Technology
        data.extend_from_slice(&50_000_000u64.to_le_bytes()); // goal = 0.05 SOL (too low)
        data.extend_from_slice(&86_400i64.to_le_bytes()); // 1 day

        let ix = Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(admin.pubkey(), true),
                AccountMeta::new(campaign, false),
                AccountMeta::new_readonly(vault, false),
                AccountMeta::new(global_state, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        };
        let tx = Transaction::new_signed_with_payer(
            &[ix], Some(&admin.pubkey()), &[&admin], svm.latest_blockhash(),
        );
        assert!(svm.send_transaction(tx).is_err(), "Low goal should fail");
    }
}
