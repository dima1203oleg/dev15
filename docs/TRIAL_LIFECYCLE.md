# Trial lifecycle

The default trial is 30 calendar days. Attribution may remain attached during the trial, but `TRIAL_ACTIVE` and `TRIAL_EXPIRED` cannot qualify a payment or increment partner rank. `SubscriptionRepository.startTrial` persists the subscription and `TRIAL_STARTED` event atomically, and schedules idempotent in-app reminders at T−7, T−3 and T−1. `expireDueTrials` transitions only expired records and emits `TRIAL_EXPIRED`; it never infers billing consent or silently charges a user. A verified provider event may move `PAYMENT_PENDING → PREMIUM_ACTIVE`, with duplicate provider deliveries ignored by `provider_event_id`.

```text
REGISTERED → TRIAL_ACTIVE → TRIAL_ENDING → PAYMENT_PENDING → PREMIUM_ACTIVE
                                  └──────→ TRIAL_EXPIRED
```

`PAYMENT_PENDING` after trial expiry is allowed only when a valid, active billing agreement with recorded user consent exists. Otherwise the worker must transition to `TRIAL_EXPIRED`; it must never silently create a charge.
