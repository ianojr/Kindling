#[cfg(test)]
mod tests;

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("JAL6KieMTfamqTRyPMx5CLUnDUU7GVaV7aSaEJhYSHHt");

// ─── Constants ───────────────────────────────────────────────────────────────
pub const MAX_NAME: usize = 50;
pub const MAX_BIO: usize = 200;
pub const MAX_URL: usize = 200;
pub const MAX_TWITTER: usize = 50;
pub const MAX_TITLE: usize = 100;
pub const MAX_DESC: usize = 2000;
pub const MIN_GOAL: u64 = 100_000_000; // 0.1 SOL
pub const MIN_DEADLINE: i64 = 86_400;   // 1 day
pub const MAX_DEADLINE: i64 = 7_776_000; // 90 days
pub const FEE_DENOM: u64 = 10_000;

// ─── Enums ───────────────────────────────────────────────────────────────────
#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CampaignStatus {
    Active = 0,
    Successful = 1,
    Failed = 2,
    Cancelled = 3,
    Withdrawn = 4,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum Category {
    Technology = 0,
    Art = 1,
    Music = 2,
    Film = 3,
    Games = 4,
    Food = 5,
    Fashion = 6,
    Health = 7,
    Education = 8,
    Environment = 9,
    Community = 10,
    Other = 11,
}

// ─── Accounts ────────────────────────────────────────────────────────────────
#[account]
pub struct GlobalState {
    pub authority: Pubkey,       // 32
    pub fee_basis_points: u16,   // 2
    pub total_campaigns: u64,    // 8
    pub total_raised: u64,       // 8
    pub is_paused: bool,         // 1
    pub bump: u8,                // 1
}
impl GlobalState {
    pub const LEN: usize = 8 + 32 + 2 + 8 + 8 + 1 + 1;
}

#[account]
pub struct CreatorProfile {
    pub owner: Pubkey,           // 32
    pub name: String,            // 4 + 50
    pub bio: String,             // 4 + 200
    pub avatar_url: String,      // 4 + 200
    pub twitter: String,         // 4 + 50
    pub is_verified: bool,       // 1
    pub campaigns_created: u32,  // 4
    pub total_raised: u64,       // 8
    pub created_at: i64,         // 8
    pub bump: u8,                // 1
}
impl CreatorProfile {
    pub const LEN: usize = 8 + 32 + (4+MAX_NAME) + (4+MAX_BIO) + (4+MAX_URL) + (4+MAX_TWITTER) + 1 + 4 + 8 + 8 + 1;
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,         // 32
    pub title: String,           // 4 + 100
    pub description: String,     // 4 + 2000
    pub image_url: String,       // 4 + 200
    pub category: u8,            // 1
    pub goal: u64,               // 8
    pub pledged_amount: u64,     // 8
    pub backer_count: u32,       // 4
    pub deadline: i64,           // 8
    pub status: u8,              // 1
    pub is_featured: bool,       // 1
    pub created_at: i64,         // 8
    pub campaign_id: u64,        // 8
    pub bump: u8,                // 1
    pub vault_bump: u8,          // 1
}
impl Campaign {
    pub const LEN: usize = 8 + 32 + (4+MAX_TITLE) + (4+MAX_DESC) + (4+MAX_URL) + 1 + 8 + 8 + 4 + 8 + 1 + 1 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Contribution {
    pub campaign: Pubkey,        // 32
    pub backer: Pubkey,          // 32
    pub amount: u64,             // 8
    pub pledged_at: i64,         // 8
    pub refunded: bool,          // 1
    pub bump: u8,                // 1
}
impl Contribution {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1;
}

// ─── Program ─────────────────────────────────────────────────────────────────
#[program]
pub mod kindling {
    use super::*;

    // ── Platform ──────────────────────────────────────────────────────────
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let s = &mut ctx.accounts.global_state;
        s.authority = ctx.accounts.payer.key();
        s.fee_basis_points = 100; // 1%
        s.total_campaigns = 0;
        s.total_raised = 0;
        s.is_paused = false;
        s.bump = ctx.bumps.global_state;
        Ok(())
    }

    // ── Profiles ──────────────────────────────────────────────────────────
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        name: String, bio: String, avatar_url: String, twitter: String,
    ) -> Result<()> {
        require!(name.len() >= 1 && name.len() <= MAX_NAME, KindlingError::InvalidName);
        require!(bio.len() <= MAX_BIO, KindlingError::BioTooLong);
        require!(avatar_url.len() <= MAX_URL, KindlingError::UrlTooLong);
        require!(twitter.len() <= MAX_TWITTER, KindlingError::TwitterTooLong);
        let p = &mut ctx.accounts.profile;
        p.owner = ctx.accounts.signer.key();
        p.name = name; p.bio = bio; p.avatar_url = avatar_url; p.twitter = twitter;
        p.is_verified = false; p.campaigns_created = 0; p.total_raised = 0;
        p.created_at = Clock::get()?.unix_timestamp;
        p.bump = ctx.bumps.profile;
        Ok(())
    }

    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        name: String, bio: String, avatar_url: String, twitter: String,
    ) -> Result<()> {
        require!(name.len() >= 1 && name.len() <= MAX_NAME, KindlingError::InvalidName);
        require!(bio.len() <= MAX_BIO, KindlingError::BioTooLong);
        require!(avatar_url.len() <= MAX_URL, KindlingError::UrlTooLong);
        require!(twitter.len() <= MAX_TWITTER, KindlingError::TwitterTooLong);
        let p = &mut ctx.accounts.profile;
        p.name = name; p.bio = bio; p.avatar_url = avatar_url; p.twitter = twitter;
        Ok(())
    }

    // ── Campaigns ─────────────────────────────────────────────────────────
    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        title: String, description: String, image_url: String,
        category: u8, goal: u64, deadline_secs: i64,
    ) -> Result<()> {
        require!(!ctx.accounts.global_state.is_paused, KindlingError::PlatformPaused);
        require!(title.len() >= 1 && title.len() <= MAX_TITLE, KindlingError::InvalidTitle);
        require!(description.len() <= MAX_DESC, KindlingError::DescriptionTooLong);
        require!(image_url.len() <= MAX_URL, KindlingError::UrlTooLong);
        require!(goal >= MIN_GOAL, KindlingError::GoalTooLow);
        require!(deadline_secs >= MIN_DEADLINE && deadline_secs <= MAX_DEADLINE, KindlingError::InvalidDeadline);

        let clock = Clock::get()?;
        let global = &mut ctx.accounts.global_state;
        let campaign_id = global.total_campaigns;
        global.total_campaigns = global.total_campaigns.saturating_add(1);

        let c = &mut ctx.accounts.campaign;
        c.creator = ctx.accounts.creator.key();
        c.title = title; c.description = description; c.image_url = image_url;
        c.category = category; c.goal = goal;
        c.pledged_amount = 0; c.backer_count = 0;
        c.deadline = clock.unix_timestamp + deadline_secs;
        c.status = CampaignStatus::Active as u8;
        c.is_featured = false;
        c.created_at = clock.unix_timestamp;
        c.campaign_id = campaign_id;
        c.bump = ctx.bumps.campaign;
        c.vault_bump = ctx.bumps.campaign_vault;
        Ok(())
    }

    // ── Pledging ──────────────────────────────────────────────────────────
    pub fn pledge(ctx: Context<Pledge>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.global_state.is_paused, KindlingError::PlatformPaused);
        require!(amount > 0, KindlingError::InvalidAmount);
        let clock = Clock::get()?;
        let campaign = &mut ctx.accounts.campaign;
        require!(campaign.status == CampaignStatus::Active as u8, KindlingError::CampaignNotActive);
        require!(clock.unix_timestamp < campaign.deadline, KindlingError::CampaignExpired);

        let contribution = &mut ctx.accounts.contribution;
        let is_new = contribution.campaign == Pubkey::default();
        if is_new {
            contribution.campaign = campaign.key();
            contribution.backer = ctx.accounts.backer.key();
            contribution.pledged_at = clock.unix_timestamp;
            contribution.refunded = false;
            contribution.bump = ctx.bumps.contribution;
            campaign.backer_count = campaign.backer_count.saturating_add(1);
        }
        contribution.amount = contribution.amount.saturating_add(amount);
        campaign.pledged_amount = campaign.pledged_amount.saturating_add(amount);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer { from: ctx.accounts.backer.to_account_info(), to: ctx.accounts.campaign_vault.to_account_info() },
            ),
            amount,
        )?;
        Ok(())
    }

    // ── Withdraw (creator, goal met) ─────────────────────────────────────
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let clock = Clock::get()?;
        let campaign = &mut ctx.accounts.campaign;
        require!(clock.unix_timestamp >= campaign.deadline, KindlingError::DeadlineNotReached);
        require!(campaign.pledged_amount >= campaign.goal, KindlingError::GoalNotMet);
        require!(campaign.status == CampaignStatus::Active as u8, KindlingError::AlreadyWithdrawn);

        let fee = campaign.pledged_amount
            .checked_mul(ctx.accounts.global_state.fee_basis_points as u64)
            .unwrap()
            .checked_div(FEE_DENOM)
            .unwrap();
        let payout = campaign.pledged_amount.saturating_sub(fee);

        campaign.status = CampaignStatus::Withdrawn as u8;

        let global = &mut ctx.accounts.global_state;
        global.total_raised = global.total_raised.saturating_add(campaign.pledged_amount);

        let campaign_key = campaign.key();
        let seeds: &[&[&[u8]]] = &[&[b"campaign_vault", campaign_key.as_ref(), &[campaign.vault_bump]]];

        // Payout to creator
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer { from: ctx.accounts.campaign_vault.to_account_info(), to: ctx.accounts.creator.to_account_info() },
                seeds,
            ),
            payout,
        )?;
        // Fee to platform
        if fee > 0 {
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer { from: ctx.accounts.campaign_vault.to_account_info(), to: ctx.accounts.authority.to_account_info() },
                    seeds,
                ),
                fee,
            )?;
        }
        Ok(())
    }

    // ── Refund (backer, goal not met) ────────────────────────────────────
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let clock = Clock::get()?;
        let campaign = &ctx.accounts.campaign;
        require!(clock.unix_timestamp >= campaign.deadline, KindlingError::DeadlineNotReached);
        require!(campaign.pledged_amount < campaign.goal, KindlingError::GoalWasMet);
        require!(campaign.status == CampaignStatus::Active as u8
            || campaign.status == CampaignStatus::Failed as u8, KindlingError::CampaignNotActive);

        let contribution = &mut ctx.accounts.contribution;
        require!(!contribution.refunded, KindlingError::AlreadyRefunded);
        require!(contribution.amount > 0, KindlingError::InvalidAmount);

        let refund_amount = contribution.amount;
        contribution.refunded = true;

        let campaign_key = campaign.key();
        let seeds: &[&[&[u8]]] = &[&[b"campaign_vault", campaign_key.as_ref(), &[campaign.vault_bump]]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer { from: ctx.accounts.campaign_vault.to_account_info(), to: ctx.accounts.backer.to_account_info() },
                seeds,
            ),
            refund_amount,
        )?;
        Ok(())
    }

    // ── Close Campaign (creator, 0 backers) ──────────────────────────────
    pub fn close_campaign(ctx: Context<CloseCampaign>) -> Result<()> {
        require!(ctx.accounts.campaign.backer_count == 0, KindlingError::HasBackers);
        require!(ctx.accounts.campaign.status == CampaignStatus::Active as u8, KindlingError::CampaignNotActive);
        let c = &mut ctx.accounts.campaign;
        c.status = CampaignStatus::Cancelled as u8;
        Ok(())
    }

    // ── Admin ─────────────────────────────────────────────────────────────
    pub fn pause_platform(ctx: Context<AdminAction>) -> Result<()> {
        ctx.accounts.global_state.is_paused = true;
        Ok(())
    }
    pub fn unpause_platform(ctx: Context<AdminAction>) -> Result<()> {
        ctx.accounts.global_state.is_paused = false;
        Ok(())
    }
    pub fn feature_campaign(ctx: Context<FeatureCampaign>, featured: bool) -> Result<()> {
        ctx.accounts.campaign.is_featured = featured;
        Ok(())
    }
    pub fn verify_creator(ctx: Context<VerifyCreator>, verified: bool) -> Result<()> {
        ctx.accounts.profile.is_verified = verified;
        Ok(())
    }
    pub fn update_config(ctx: Context<AdminAction>, fee_basis_points: u16) -> Result<()> {
        require!(fee_basis_points <= 1000, KindlingError::FeeTooHigh); // max 10%
        ctx.accounts.global_state.fee_basis_points = fee_basis_points;
        Ok(())
    }
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        ctx.accounts.global_state.authority = new_authority;
        Ok(())
    }
}

// ─── Account Contexts ────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, space = GlobalState::LEN, seeds = [b"global_state"], bump)]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, payer = signer, space = CreatorProfile::LEN, seeds = [b"creator_profile", signer.key().as_ref()], bump)]
    pub profile: Account<'info, CreatorProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"creator_profile", signer.key().as_ref()],
        bump = profile.bump,
        constraint = profile.owner == signer.key() @ KindlingError::Unauthorized
    )]
    pub profile: Account<'info, CreatorProfile>,
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init, payer = creator,
        space = Campaign::LEN,
        seeds = [b"campaign", creator.key().as_ref(), &global_state.total_campaigns.to_le_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: PDA vault for this campaign
    #[account(seeds = [b"campaign_vault", campaign.key().as_ref()], bump)]
    pub campaign_vault: SystemAccount<'info>,
    #[account(mut, seeds = [b"global_state"], bump = global_state.bump)]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Pledge<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(
        init_if_needed, payer = backer,
        space = Contribution::LEN,
        seeds = [b"contribution", campaign.key().as_ref(), backer.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,
    /// CHECK: campaign vault PDA
    #[account(mut, seeds = [b"campaign_vault", campaign.key().as_ref()], bump = campaign.vault_bump)]
    pub campaign_vault: SystemAccount<'info>,
    #[account(seeds = [b"global_state"], bump = global_state.bump)]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut, has_one = creator @ KindlingError::Unauthorized)]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: campaign vault PDA
    #[account(mut, seeds = [b"campaign_vault", campaign.key().as_ref()], bump = campaign.vault_bump)]
    pub campaign_vault: SystemAccount<'info>,
    #[account(mut, seeds = [b"global_state"], bump = global_state.bump)]
    pub global_state: Account<'info, GlobalState>,
    /// CHECK: platform authority receives fee
    #[account(mut, address = global_state.authority)]
    pub authority: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,
    pub campaign: Account<'info, Campaign>,
    #[account(mut, seeds = [b"contribution", campaign.key().as_ref(), backer.key().as_ref()], bump = contribution.bump, has_one = backer @ KindlingError::Unauthorized)]
    pub contribution: Account<'info, Contribution>,
    /// CHECK: campaign vault PDA
    #[account(mut, seeds = [b"campaign_vault", campaign.key().as_ref()], bump = campaign.vault_bump)]
    pub campaign_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseCampaign<'info> {
    pub creator: Signer<'info>,
    #[account(mut, has_one = creator @ KindlingError::Unauthorized)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"global_state"], bump = global_state.bump, has_one = authority @ KindlingError::Unauthorized)]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct FeatureCampaign<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [b"global_state"], bump = global_state.bump, has_one = authority @ KindlingError::Unauthorized)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct VerifyCreator<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [b"global_state"], bump = global_state.bump, has_one = authority @ KindlingError::Unauthorized)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub profile: Account<'info, CreatorProfile>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"global_state"], bump = global_state.bump, has_one = authority @ KindlingError::Unauthorized)]
    pub global_state: Account<'info, GlobalState>,
}

// ─── Errors ──────────────────────────────────────────────────────────────────
#[error_code]
pub enum KindlingError {
    #[msg("Platform is paused")] PlatformPaused,
    #[msg("Unauthorized")] Unauthorized,
    #[msg("Invalid name")] InvalidName,
    #[msg("Bio too long")] BioTooLong,
    #[msg("URL too long")] UrlTooLong,
    #[msg("Twitter handle too long")] TwitterTooLong,
    #[msg("Invalid title")] InvalidTitle,
    #[msg("Description too long")] DescriptionTooLong,
    #[msg("Goal must be at least 0.1 SOL")] GoalTooLow,
    #[msg("Deadline must be 1–90 days")] InvalidDeadline,
    #[msg("Campaign is not active")] CampaignNotActive,
    #[msg("Campaign has expired")] CampaignExpired,
    #[msg("Invalid amount")] InvalidAmount,
    #[msg("Deadline not reached yet")] DeadlineNotReached,
    #[msg("Funding goal not met")] GoalNotMet,
    #[msg("Funding goal was met — refunds unavailable")] GoalWasMet,
    #[msg("Already withdrawn")] AlreadyWithdrawn,
    #[msg("Already refunded")] AlreadyRefunded,
    #[msg("Campaign has backers — cannot close")] HasBackers,
    #[msg("Platform fee too high (max 10%)")] FeeTooHigh,
}
