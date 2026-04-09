# COMPREHENSIVE HARDCODED TEXT ANALYSIS REPORT
## VibeLive React Native App - i18n Migration

**Date:** April 6, 2026  
**Total Files with Hardcoded Text:** 58+  
**Total Hardcoded Strings:** 2000+  

---

## EXECUTIVE SUMMARY

The analysis reveals **significantly more hardcoded text** than initially identified. While the i18n infrastructure is properly set up, only 3 files have been refactored:
- ✅ `Settings.tsx` (completed)
- ✅ `LoginContainer.tsx` (completed)
- ✅ `SignUpContainer.tsx` (completed)

**ALL other files remain unrefactored** with extensive hardcoded user-facing text.

---

## DETAILED FINDINGS BY CATEGORY

### 1. SETTINGS MODULE (7 files, 415 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `StreamingPreferences.tsx` | 110 | HIGH | ❌ Not Refactored |
| `PrivacySettings.tsx` | 72 | HIGH | ❌ Not Refactored |
| `PasswordSettings.tsx` | 58 | HIGH | ❌ Not Refactored |
| `EmailSettings.tsx` | 56 | HIGH | ❌ Partially viewed |
| `NotificationSettings.tsx` | 51 | HIGH | ❌ Not Refactored |
| `Settings.tsx` | 35 | HIGH | ✅ Refactored |
| `BlockedUsers.tsx` | 33 | HIGH | ❌ Not Refactored |

**Hardcoded Examples Found:**
- `Alert.alert('Success', 'Notification settings updated successfully')`
- `Alert.alert('Error', 'Failed to update settings')`
- `title="Push Notifications"`
- `subtitle="Receive notifications on your device"`
- `title="Live Stream Alerts"`
- `subtitle="Get notified when streamers you follow go live"`
- `title="Default Category"`
- `title="Video Quality"`
- `label="Auto (Recommended)"`
- `description="Automatically adjust based on connection"`
- `title="Streaming Tips"`
- `title="Your Streaming Stats"`
- `statLabel="Total Streams"`
- `statLabel="Hours Streamed"`
- `statLabel="Peak Viewers"`
- `title="Profile Visibility"`
- `title="Privacy & Security"`
- `title="Security Tips"`
- `title="Manage Blocked Users"`

---

### 2. LIVESTREAM MODULE (8 files, 338 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `EventSelections.tsx` | 140 | CRITICAL | ❌ Not Refactored |
| `LiveStreamContainer.tsx` | 107 | CRITICAL | ❌ Not Refactored |
| `EndStreamModal.tsx` | 27 | HIGH | ❌ Not Refactored |
| `SubcategorySelection.tsx` | 23 | HIGH | ❌ Not Refactored |
| `FreeStreamLimitModal.tsx` | 19 | HIGH | ❌ Not Refactored |
| `MonthlyLimitModal.tsx` | 15 | HIGH | ❌ Not Refactored |
| `SwitcherContainer.tsx` | 4 | MEDIUM | ❌ Not Refactored |
| `RTMPStreamingHelper.ts` | 3 | MEDIUM | ❌ Not Refactored |

**Hardcoded Examples Found:**
- `"Tonight"`, `"This Month"`, `"All Season"` (boost packages)
- `"Tonight only"`, `"MOST POPULAR"`, `"BEST VALUE"` (badges)
- `"Nightlife & Parties"`, `"Bars & Lounges"` (categories)
- `"Cancel"`, `"Confirm Purchase"` (buttons)
- `"Are you sure you want to purchase..."` (confirmations)
- `"Free Streaming Limit Reached"`
- `"You've used all your free streaming time..."`
- `"Go Live"`, `"End Stream"`
- `"Connecting..."`, `"Streaming Live"`

---

### 3. VENUE CLAIM MODULE (10 files, 215 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `VenueClaimVerificationScreen.tsx` | 40 | HIGH | ❌ Not Refactored |
| `VenueClaimTierSelectionScreen.tsx` | 31 | HIGH | ❌ Not Refactored |
| `VenueClaimReviewScreen.tsx` | 25 | HIGH | ❌ Not Refactored |
| `VenueClaimConfirmationScreen.tsx` | 21 | HIGH | ❌ Not Refactored |
| `VenueClaimStatusScreen.tsx` | 21 | HIGH | ❌ Not Refactored |
| `VenueSearchScreen.tsx` | 21 | HIGH | ❌ Not Refactored |
| `VenueClaimPathSelectionScreen.tsx` | 17 | MEDIUM | ❌ Not Refactored |
| `VenueTaggingScreen.tsx` | 17 | MEDIUM | ❌ Not Refactored |
| `VenueClaimDetailsScreen.tsx` | 14 | MEDIUM | ❌ Not Refactored |
| `VenueClaimWebRedirect.tsx` | 8 | LOW | ❌ Not Refactored |

**Hardcoded Examples:**
- `"Claim Your Venue"`
- `"Verify Ownership"`
- `"Upload Documents"`
- `"Basic Plan"`, `"Pro Plan"`, `"Enterprise"`
- `"Submit Claim"`
- `"Pending Review"`
- `"Approved"`, `"Rejected"`

---

### 4. SQUAD MODULE (6 files, 351 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `SquadRecommendationView.tsx` | 100 | HIGH | ❌ Not Refactored |
| `SquadFormingView.tsx` | 68 | HIGH | ❌ Not Refactored |
| `SquadScreen.tsx` | 67 | HIGH | ❌ Not Refactored |
| `SquadJoinScreen.tsx` | 64 | HIGH | ❌ Not Refactored |
| `SquadConfirmedView.tsx` | 33 | HIGH | ❌ Not Refactored |
| `SquadOutcomeScreen.tsx` | 19 | MEDIUM | ❌ Not Refactored |

**Hardcoded Examples:**
- `"Form a Squad"`
- `"Join Squad"`
- `"Squad Code"`
- `"Invite Friends"`
- `"Squad Full"`
- `"Start Streaming"`
- `"Vote Results"`

---

### 5. EVENTS MODULE (9 files, 388 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `EventDetailsScreen.tsx` | 99 | HIGH | ❌ Not Refactored |
| `EventBasicDetails.tsx` | 81 | HIGH | ❌ Not Refactored |
| `EventsListScreen.tsx` | 73 | HIGH | ❌ Not Refactored |
| `EventCreationFlow.tsx` | 57 | HIGH | ❌ Not Refactored |
| `EventPromotion.tsx` | 41 | MEDIUM | ❌ Not Refactored |
| `EventDateTime.tsx` | 14 | MEDIUM | ❌ Not Refactored |
| `EventTicketing.tsx` | 13 | MEDIUM | ❌ Not Refactored |
| `StepIndicator.tsx` | 6 | LOW | ❌ Not Refactored |
| `EventLocation.tsx` | 4 | LOW | ❌ Not Refactored |

**Hardcoded Examples:**
- `"Create Event"`
- `"Event Name"`
- `"Event Description"`
- `"Start Date"`, `"End Date"`
- `"Ticket Price"`
- `"Promote Event"`
- `"Draft"`, `"Published"`

---

### 6. VOTING MODULE (6 files, 206 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `VenueSelectionScreen.tsx` | 92 | HIGH | ❌ Not Refactored |
| `VenueOwnerDashboard.tsx` | 49 | HIGH | ❌ Not Refactored |
| `VenueHeatmapOverlay.tsx` | 28 | HIGH | ❌ Not Refactored |
| `VotingPreferences.tsx` | 26 | HIGH | ❌ Not Refactored |
| `VoteToast.tsx` | 9 | MEDIUM | ❌ Not Refactored |
| `VotingInitializer.tsx` | 2 | LOW | ❌ Not Refactored |

**Hardcoded Examples:**
- `"Vote Hot"`, `"Vote Dead"`
- `"Venue Vibes"`
- `"Select Venue"`
- `"Heat Score"`
- `"Voting Preferences"`
- `"Notification Radius"`

---

### 7. ONBOARDING MODULE (4 files, 195 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `OnboardingNotifications.tsx` | 61 | HIGH | ❌ Not Refactored |
| `OnboardingAccountCreation.tsx` | 57 | HIGH | ❌ Not Refactored |
| `OnboardingLocationAccess.tsx` | 45 | HIGH | ❌ Not Refactored |
| `OnboardingInterests.tsx` | 32 | HIGH | ❌ Not Refactored |

**Hardcoded Examples:**
- `"Welcome to VibeLive"`
- `"Enable Notifications"`
- `"Allow Location Access"`
- `"Select Your Interests"`
- `"Next"`, `"Skip"`, `"Get Started"`
- `"Find the best vibes near you"`

---

### 8. SERVICES MODULE (8 files, 67 matches)
| File | Matches | Priority | Status |
|------|---------|----------|--------|
| `FCMNotificationService.ts` | 15 | MEDIUM | ❌ Not Refactored |
| `RTKAnalyticsService.ts` | 12 | LOW | ❌ Not Refactored |
| `AnalyticsServiceFactory.ts` | 9 | LOW | ❌ Not Refactored |
| `VotingNotificationHandler.ts` | 9 | MEDIUM | ❌ Not Refactored |
| `AnalyticsService.ts` | 7 | LOW | ❌ Not Refactored |
| `GeofenceMonitorService.ts` | 6 | MEDIUM | ❌ Not Refactored |
| `OfflineVoteQueue.ts` | 6 | MEDIUM | ❌ Not Refactored |
| `SocketAnalyticsService.ts` | 3 | LOW | ❌ Not Refactored |

**Hardcoded Examples:**
- `"Permission Required"`
- `"Enable notifications to receive updates"`
- `"Location permission is required"`
- `"Vote recorded successfully"`
- `"Failed to submit vote"`

---

## ADDITIONAL FILES NOT YET ANALYZED

Based on file structure, the following likely contain hardcoded text:

### Navigation Files
- `StackNavigation.tsx`
- `TabNavigation.tsx`
- `DrawerNavigation.tsx`

### UI Components
- `Button.tsx` (props may receive hardcoded text)
- `Input.tsx`
- `Modal.tsx`
- `Toast.tsx`

### Map Components
- `MapContainer.tsx`
- `Map.tsx`
- `LiveIcon.tsx`
- `ResetLocationButton.tsx`

### Profile & Account
- `Profile.tsx`
- Other Account-related screens

---

## REFACTORING PRIORITY MATRIX

### Priority 1 (CRITICAL - User-facing core features)
1. `LiveStream/EventSelections.tsx` (140 matches) - Boost purchasing
2. `LiveStream/LiveStreamContainer.tsx` (107 matches) - Streaming interface
3. `Events/EventDetailsScreen.tsx` (99 matches) - Event viewing
4. `Voting/VenueSelectionScreen.tsx` (92 matches) - Voting interface
5. `Settings/StreamingPreferences.tsx` (110 matches) - Settings

### Priority 2 (HIGH - User settings and preferences)
6. `Squad/SquadRecommendationView.tsx` (100 matches)
7. `Settings/PrivacySettings.tsx` (72 matches)
8. `Settings/PasswordSettings.tsx` (58 matches)
9. `Settings/EmailSettings.tsx` (56 matches)
10. `Settings/NotificationSettings.tsx` (51 matches)
11. `Events/EventBasicDetails.tsx` (81 matches)
12. `Events/EventsListScreen.tsx` (73 matches)
13. `Events/EventCreationFlow.tsx` (57 matches)
14. `Squad/SquadFormingView.tsx` (68 matches)
15. `Squad/SquadScreen.tsx` (67 matches)

### Priority 3 (MEDIUM - Supporting features)
16-30. All remaining files with 20-60 matches each

### Priority 4 (LOW - Minor UI elements)
31-58. Files with <20 matches

---

## ESTIMATED REFACTORING EFFORT

| Phase | Files | Hours | Timeline |
|-------|-------|-------|----------|
| Phase 1: Critical Core | 5 | 15-20 hours | Days 1-3 |
| Phase 2: High Priority | 10 | 20-25 hours | Days 4-7 |
| Phase 3: Medium Priority | 15 | 15-20 hours | Days 8-10 |
| Phase 4: Low Priority | 28 | 10-15 hours | Days 11-12 |
| **TOTAL** | **58** | **60-80 hours** | **~2-3 weeks** |

---

## MISSING TRANSLATION KEYS

The existing `en.json` and `es.json` files are missing keys for:

### LiveStream Module
- All boost package names and descriptions
- All event category labels
- Stream status messages
- Free/Monthly limit messages

### Squad Module
- Squad formation labels
- Vote outcome labels
- Squad code messages

### Events Module
- Event creation step labels
- Ticketing labels
- Promotion labels

### Voting Module
- Vote action buttons
- Heat score labels
- Venue selection labels

### Onboarding
- All onboarding screen content
- Permission request messages
- Interest selection labels

---

## RECOMMENDATIONS

1. **Immediate Action:** Create a dedicated i18n task force or sprint
2. **Parallel Development:** Assign different modules to different developers
3. **Testing Strategy:** Implement automated string detection tests
4. **Documentation:** Create i18n style guide for future development
5. **QA Process:** Require i18n review for all new PRs

---

## CONCLUSION

The initial i18n implementation successfully established the infrastructure but **only scratched the surface** of the actual refactoring work. With 2000+ hardcoded strings across 58+ files, this is a **significant undertaking** requiring 60-80 hours of focused development work.

**Next Steps:**
1. Prioritize Phase 1 (Critical Core) files
2. Expand translation files with missing keys
3. Systematically refactor each file following the established pattern
4. Implement automated verification to prevent regression

---

*Report Generated: April 6, 2026*  
*Analyst: Cascade AI Code Review*
