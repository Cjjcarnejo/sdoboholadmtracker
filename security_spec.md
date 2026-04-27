# Security Specification: ADM Tracker

## 1. Data Invariants
- A `StudentRecord` must have a valid `studentName`, `grade`, `school`, and `district`.
- A `StudentRecord` can only be created by an authenticated user.
- A `StudentRecord`'s `createdBy` field must match the `request.auth.uid`.
- A `User` profile can only be created/updated by the owner or an admin.
- Users can only read student records if they are an admin or if they created the record.
- Admins have full access to all records.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

### Student Records
1. **Identity Spoofing**: `create` student record with `createdBy` set to another user's UID.
2. **Shadow Field Injection**: `create` student record with extra field `isVerified: true`.
3. **Invalid ID**: `get` record with ID `../../secrets/config`.
4. **Unauthenticated Read**: `list` students without logging in.
5. **Unauthorized Update**: Non-owner/non-admin attempting to change a student's `studentName`.
6. **Immutable Field Change**: Owner attempting to change `createdAt` or `createdBy` on an existing record.
7. **Resource Poisoning**: Injecting a 1MB string into the `studentName` field.
8. **Invalid Enum**: Setting `gender` to "Robot".
9. **PII Breach**: Non-admin user querying `/users` collection for another user's email.
10. **State/Assessment Bypass**: Regular user changing a pending assessment directly to "Complete" without being the owner or having admin rights (if that logic was restricted).
11. **Timestamp Spoofing**: Sending a client-side timestamp for `updatedAt` instead of `serverTimestamp()`.
12. **Orphaned Record**: Creating a student record with a `district` that doesn't match the user's assigned district (integrity constraint).

## 3. Test Runner (Draft Logic)
The `firestore.rules.test.ts` will verify that:
- `auth != null` is required for all writes.
- `isValidStudentRecord(incoming())` is called on all writes to `/students`.
- `incoming().diff(existing()).affectedKeys().hasOnly([...])` is used for updates.
- `resource.data.createdBy == request.auth.uid || isAdmin()` for reads.
