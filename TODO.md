# Fix Asset Addition Issue

## Problem Identified
The issue is that `profile?.lab_id` is being used as a string value for the `allocated_lab` field, but the database expects a UUID that references the `labs` table.

## Steps to Fix
1. [x] Enable error logging in AssetForm to see the actual error
2. [x] Modify AssetForm to fetch the actual lab UUID based on the lab identifier
3. [x] Update the form to handle UUID references properly
4. [ ] Test the fix

## Implementation Plan
- Use LabService.getLabByIdentifier() to get the lab UUID from the lab identifier
- Update the form data initialization to use proper UUID values
- Ensure the allocated_lab field contains a valid UUID reference
- Add error handling and fallback mechanisms

## Changes Made
- Added `fetchingLab` state to track lab loading
- Implemented `fetchLabId` function to get lab UUID from identifier
- Added error handling with fallback to first available lab
- Updated form data initialization to use proper UUID values

## Files Modified
- src/components/Assets/AssetForm.tsx
