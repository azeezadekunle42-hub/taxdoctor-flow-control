

## Add Tax Authority Risk Callout

### What changes
1. **Update `src/components/ProblemSection.tsx`**:
   - Add a new problem card as the 5th card (before "No Idea If You're Profitable"), titled something like **"NRS Comes Knocking"**
   - Description: When your records are incomplete, the Nigeria Revenue Service doesn't wait. They estimate what you owe — and it's always more than the real number. Once they freeze your account, you're stuck.
   - Use the `ShieldAlert` icon from lucide-react
   - Update the reference from FIRS to NRS in the existing "Tax Deadlines Slip" card as well (currently says "FIRS penalties")

2. **Update grid layout**: The section will now have 7 cards instead of 6. The grid will still work with `lg:grid-cols-3` — you'll get 3-3-1 on large screens, which is fine, or we can make the last row span wider for visual balance.

### Copy for the new card
- **Title**: "NRS Comes Knocking"  
- **Description**: "If your records are a mess, the Nigeria Revenue Service won't ask nicely. They'll estimate what you owe — and it's always more than the real number."

### Technical details
- Insert new entry at index 4 in the `problems` array (before the last item)
- Import `ShieldAlert` from lucide-react
- Change "FIRS penalties" to "NRS penalties" in the tax deadlines card
- Consider adjusting the 7th card to span full width or two columns on the last row for cleaner layout

