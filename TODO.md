# TODO: Implement Lab Match for Approve/Delete Buttons

## Assets (AssetList.tsx)
- [x] Update canApprove function to include lab match for Lab Incharge and add Lab Assistant
- [x] Update canDelete function to include lab match for Lab Incharge
- [x] Update handleApprove to handle Lab Assistant

## Issues (IssueList.tsx)
- [x] Update canResolve function to include Lab Incharge with lab match

## Transfers (TransferList.tsx)
- [x] Update asset select query to include allocated_lab
- [x] Update canDelete function to include lab match for Lab Incharge (from_lab === profile.lab_id)

## Testing
- [ ] Test that buttons appear only when user's lab matches asset's lab
- [ ] Verify HOD still has full access
