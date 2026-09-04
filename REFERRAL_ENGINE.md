# REFERRAL & RANK ENGINE SPECIFICATION — SIREN UA 2026

## 1. Two-Level Revenue Model
- **Level 1 (L1)**: Personal customer directly referred by the partner.
- **Level 2 (L2)**: Customer directly referred by the partner's L1 partner.
- **Level 3+ (L3+)**: **0% (Strictly Non-Commissionable)**.

## 2. Unified Partner Rate Matrix
| Rank | Qualified Active Paid L1s | L1 Rate | L2 Rate |
|---|---|---|---|
| **Starter** | 1–9 | 5% (500 bps) | 5% (500 bps) *(Unlocked immediately)* |
| **Bronze** | 10–29 | 10% (1000 bps) | 10% (1000 bps) |
| **Silver** | 30–74 | 15% (1500 bps) | 15% (1500 bps) |
| **Gold** | 75–199 | 20% (2000 bps) | 20% (2000 bps) |
| **Platinum** | 200+ | 25% (2500 bps) | 25% (2500 bps) |

## 3. Qualified Active Paid Criteria
A user counts towards the partner's rank threshold if and only if:
1. Direct L1 attribution is cryptographically valid and not expired.
2. Subscription is paid and confirmed by the payment gateway.
3. Transaction is not refunded, reversed, or charged back.
4. User is not flagged as self-referral or fraudulent.
5. Account is active in the current billing cycle.

## 4. Commission Calculation Formula
```
L1_Commission = QCB * Effective_Partner_Rate(L1_Partner)
L2_Commission = QCB * Effective_Partner_Rate(L2_Partner)
Total_Allocation = L1_Commission + L2_Commission + Campaign_Bonus

IF Total_Allocation > (QCB * 0.50) THEN
    TRIGGER CAP_VALIDATION_FAILED (Reject Ledger Posting)
END IF
```

## 5. Grace Period & Requalification
- When active qualified L1 count drops below rank threshold:
  `State = GRACE` (rate remains preserved for 14 days grace window).
- If threshold restored within window: `State = ACTIVE` (Requalified).
- If grace window expires: Rank recalculation to lower tier.
- Abuse limits: Max 2 grace cycles in 180 days rolling window; 90 days cooldown thereafter.

## 6. Ambassador Tier
- Non-automated qualitative tier for strategic creators:
  - Ambassador Candidate: 500+ Qualified L1s
  - Ambassador (Official): 500+ with Compliance & Contract Approval
  - Ambassador Pro: 750+
  - Ambassador Elite: 1000+
  - Ambassador Legend: 2500+
- Verified Gold badge, dedicated UTM vanity slugs, customized co-branded landing pages.
