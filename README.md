# RenewMargin

RenewMargin finds maintenance agreements whose real servicing cost has outgrown their price and recommends a profitable renewal price.

## MVP

The first release is intentionally narrow: import agreement/service-cost data, calculate actual gross margin, rank margin leakage, recommend renewal pricing, and export the results. Financial calculations are deterministic; AI will later be used only for messy-field normalization and explanations.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Current build

- Responsive agreement profitability dashboard
- Deterministic margin/repricing engine
- Demo HVAC/service agreement dataset
- Relational MVP schema in `data/schema.sql`
- Sample import format in `sample-data/agreements.csv`

## Formula

`actual cost = labor hours × loaded labor rate + materials + other cost`

`recommended renewal price = actual cost / (1 - target gross margin)`

The default target margin in the demo is 40%.

## Next milestone

Build CSV upload/mapping, persist scans, agreement detail views, and downloadable repricing reports. Then validate the free Margin Leak Scan with real contractors before adding billing or deep FSM integrations.
