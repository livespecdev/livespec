# Push Notification Provider

A managed third-party service responsible for delivering push notifications to user devices (iOS, Android, web). The app calls the provider's REST API; the provider handles platform-specific transport (APNS, FCM, Web Push).

## Integration boundary

- **Outbound** — the app sends a notification payload (recipient device token, title, body, deep link) over HTTPS with a bearer token.
- **Inbound** — the provider sends delivery receipts via webhook to a single endpoint we expose. Receipts are best-effort and not guaranteed.
- **Device registration** — devices register with the provider directly from the mobile clients; the app stores the resulting device tokens against the user record.

## Failure model

- The provider may return `429` under load. The app retries with exponential backoff up to three times, then drops the notification and logs.
- The provider may silently fail to deliver (network, device offline, user opted out at OS level). The app does not retry on its own — the user may miss the reminder; this is acceptable per the product's stance that reminders are best-effort.
- Provider outages do not block the app: scheduling a reminder is durable in our own store; the dispatch step is what depends on the provider.

## Why a managed provider

Operating push delivery in-house requires maintaining APNS certificates, FCM credentials, and platform-specific quirks across iOS and Android versions. The cost of a managed provider is well below the engineering cost of doing it ourselves at our scale.
