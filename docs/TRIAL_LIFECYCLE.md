# Trial lifecycle

The default trial is 30 calendar days. Attribution may remain attached during the trial, but `TRIAL_ACTIVE` and `TRIAL_EXPIRED` cannot qualify a payment or increment partner rank.

```text
REGISTERED → TRIAL_ACTIVE → TRIAL_ENDING → PAYMENT_PENDING → PREMIUM_ACTIVE
                                  └──────→ TRIAL_EXPIRED
```

`PAYMENT_PENDING` after trial expiry is allowed only when a valid, active billing agreement with recorded user consent exists. Otherwise the worker must transition to `TRIAL_EXPIRED`; it must never silently create a charge.
