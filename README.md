# ABA SuperSync

ABA SuperSync is a professional clinical supervision management platform designed for **Registered Behavior Technicians (RBTs)** and **Board Certified Behavior Analysts (BCBAs)** to manage their associations, track supervision logs, and ensure audit compliance with BACB regulations.

## 🩺 Clinical Oversight Features

- **5% Supervision Volume Tracking**: Automatically calculates the required supervision hours based on monthly behavior-analytic service hours.
- **Direct Observation Auditing**: Flags months where a direct client observation (a BACB requirement) hasn't occurred.
- **Group Supervision Ratios**: Monitors group vs. individual hour ratios to ensure group sessions do not exceed the 50% threshold.
- **BACB 5th Edition Task List Mapping**: Built-in checklist for all Task List areas (Measurement, Assessment, Skill Acquisition, etc.).
- **Digital Attestations**: Cryptographically-bound (simulated) electronic signatures with timestamps for both clinical partners.

## 🚀 Technical Features

- **Zero-Latency Persistence**: Uses browser `localStorage` for high-speed, lightweight data management without external dependencies.
- **Mock Google Authentication**: Polished login experience with pre-seeded clinical profiles for immediate testing.
- **Responsive Clinical Design**: A mobile-optimized, professional theme using Indigo and Teal accents.
- **Print-to-Audit Engine**: Integrated `@media print` styles for exporting high-fidelity, audit-ready PDF documents from supervision logs.

## 🧪 Testing the Portal

1. **Sign In**: Use one of the "Quick Demo Access" accounts (Jordan for RBT, Sarah for BCBA).
2. **Associate**: Use the **Discovery** tab to find other clinicians and send "Association Requests".
3. **Log Session**: Navigate to **Log Session** to file a new supervised record.
4. **Audit**: View the **Dashboard** to see live compliance progress bars.
5. **Print**: In the **History** tab, select a record and click **Export** or use your browser's Print command (Ctrl+P).
