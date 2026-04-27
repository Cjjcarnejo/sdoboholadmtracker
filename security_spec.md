# Security Specification - SDO Bohol ADM Tracker

## 1. Data Invariants
- A student record must be associated with a valid school ID.
- Only authenticated users with appropriate roles (Admin, School-Coordinator, District-Coordinator) can create or update records.
- School Coordinators can only manage students in their own school.
- District Coordinators can read all students in their district.
- Admins have full access.
- LRN must be a 12-digit numeric string.

## 2. The Dirty Dozen Payloads (Targeting Rejection)

1. **Identity Spoofing**: Attempt to create a student record with `schoolId` of another school.
2. **LRN Poisoning**: Attempt to set LRN to a 1MB string.
3. **Privilege Escalation**: Attempt to update own user record to `role: 'Admin'`.
4. **Orphaned Student**: Create student with non-existent `schoolId`.
5. **State Skipping**: Manually setting `status` to 'Graduated' without required years of data.
6. **Mass Cleanup**: Authenticated user trying to `delete` all students in a collection.
7. **Cross-School Write**: School-Coordinator of School A trying to update student in School B.
8. **Field Injection**: Adding `isVerified: true` to a student document.
9. **Timestamp Manipulation**: Providing a custom `updatedAt` from the future.
10. **Query Scrape**: Anonymous user trying to `list` all students.
11. **PII Leak**: Non-admin user trying to `get` the full private user profile of an admin.
12. **ID Collision Attack**: Trying to use `/../` in a document ID.

## 3. Test Runner (Draft)

```typescript
// firestore.rules.test.ts (logical representation)
// - should deny create if schoolId does not match user's schoolId (unless Admin)
// - should deny update if affectedKeys().has('role') and !isAdmin()
// - should deny read if !isSignedIn()
```
