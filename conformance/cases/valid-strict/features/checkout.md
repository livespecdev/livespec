# Checkout

As a shopper, I want to pay for the items in my cart so that I can complete my purchase.

## Requirements

- [ ] REQ-1: Shopper can submit an order with a saved payment method
  - [ ] AC-1.1: Submitting charges the selected method exactly once

## Assumptions

- [ ] AS-1: A payment provider integration is already configured

## Questions

- [ ] Q-1: Should partial refunds be in scope for the first release?

## Issues

- [ ] ISS-1: Tax rounding differs by region and needs a decision

## UX

The submit button stays disabled until a payment method is selected.

## Tech

Charges go through the payment provider with an idempotency key per order.
