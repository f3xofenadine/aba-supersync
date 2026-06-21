# Security Specification - Supervision Tracker

## Data Invariants
1. A **User** profile must be createable by any authenticated user, but only modifiable by the owner.
2. An **Association** must involve two distinct users (RBT and BCBA). Access restricted to the participants.
3. A **SupervisionSession** must link an RBT and a BCBA who have an association. Access restricted to the participants.
4. Terminal State Locking: Once a session is 'COMPLETED', it cannot be modified.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Role Escalation**: RBT attempting to change their role to ADMIN.
3. **Ghost Association**: User trying to create an association where they are neither the RBT nor the BCBA.
4. **Unauthorized Read**: RBT trying to read another RBT's supervision logs.
5. **PII Leak**: Unauthorized user trying to read user signatures.
6. **Signature Forgery**: RBT trying to provide a BCBA's signature.
7. **Timestamp Poisoning**: Sending a client-side `createdAt` timestamp from the future.
8. **State Skip**: Moving a session from 'DRAFT' to 'COMPLETED' without signatures.
9. **Post-Terminal Edit**: Modifying a 'COMPLETED' session's clinical feedback.
10. **Shadow Field injection**: Adding `isVerified: true` to a user profile.
11. **Resource Exhaustion**: Sending a 1MB string for a `name` field.
12. **Orphaned Session**: Creating a session where `rbtId` doesn't exist.

## Security Rules implementation Strategy
- `isValidId(id)`: Standard regex and size check.
- `isOwner(uid)`: `request.auth.uid == uid`.
- `isParticipant(data)`: `request.auth.uid == data.rbtId || request.auth.uid == data.bcbaId`.
- `isValidUser(data)`: Check required fields, sizes, and `request.auth.uid`.
- `isValidAssociation(data)`: Check status enum and UIDs.
- `isValidSession(data)`: Check status enum, and ensure participants matches `request.auth.uid`.
