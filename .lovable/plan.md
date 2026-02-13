
# Nigerianize the Landing Page Dashboard

## Problem
The hero section currently displays a static image (`dashboard-mockup.jpg`) that shows dollar ($) signs and generic text. Since this is a Nigerian accounting practice, all currency references and contextual text should reflect Nigeria (Naira sign, Nigerian business context).

## Solution
Replace the static dashboard image in the hero section with a **code-built dashboard mockup component** that displays:

- **Naira (₦)** currency throughout
- Nigerian business context (e.g., Nigerian bank names, FIRS compliance references)
- The same 4-panel layout visible in the current image: Monthly P&L chart, Payroll Summary, Bank Reconciliation, and Compliance Calendar

## Changes

### 1. Create `src/components/DashboardMockup.tsx`
A new React component that visually replicates the dark dashboard shown in the hero, but with Nigerian data:

- **Monthly Profit & Loss** panel: Bar chart (using recharts, already installed) with ₦ axis labels
- **Payroll Summary** panel: Employee count, gross pay in ₦, net pay in ₦
- **Bank Reconciliation** panel: Account reference and balance in ₦
- **Compliance Calendar** panel: Nigerian compliance items (FIRS filing, PAYE remittance, pension contributions, VAT returns)

Styling: Dark background (`bg-surface-dark`), rounded cards, yellow/primary accent — matching the existing brand identity.

### 2. Update `src/components/HeroSection.tsx`
- Remove the static `<img>` tag referencing `dashboard-mockup.jpg`
- Import and render the new `<DashboardMockup />` component in its place
- Remove the `dashboard-mockup.jpg` import

## Technical Details

- Uses `recharts` (already installed) for the bar chart in the P&L panel
- All data is hardcoded/static — purely visual, no backend needed
- Responsive layout using CSS grid
- Dark themed to match the current mockup aesthetic
- No new dependencies required
