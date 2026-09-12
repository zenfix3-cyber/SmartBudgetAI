# SmartBudget AI — Student Budget Guardian Agent

Public-facing site for **SmartBudget AI**: a student budgeting app built on [Base44](https://base44.com), made **agentic** with RealRelay's AI — one focused agent that keeps students within budget while helping them save.

Hosted via GitHub Pages → `https://<username>.github.io/smartbudget-ai`

## Structure

- `index.html` — homepage: Problem → Solution → Agent Flow → Demo → Business → Contact
- `style.css` — design system
- `script.js` — interactive six-step demo walkthrough + nav/scroll behavior

The **Demo** section is a live, playable rendering of the demonstration scenario from the RealRelay integration spec (Appendix M.6): a synthetic student adds a S$35 food-delivery order, and the Guardian Agent detects a projected S$65 overspend, picks one explainable intervention, shows the in-app alert, and closes the feedback loop — without ever executing a transfer.

All demo data is synthetic.

## Deploy (GitHub Pages)

1. Create a repo named `smartbudget-ai` and push these three files to the `main` branch.
2. Repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save.
3. Your site goes live at `https://<username>.github.io/smartbudget-ai/` within a minute or two.

## Before you share it — replace these placeholders

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `your-team@smartbudget-ai.example` | Contact section | your real team email |
| `https://github.com/username/smartbudget-ai` | Contact section + this README | your actual repo URL |
| 🇸🇬 launch copy / S$ pricing | Hero, Demo, Business | adjust if positioning changes |

## Test locally

Open `index.html` directly in a browser, or:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

No build step, no dependencies — plain HTML/CSS/JS.

## Status (Sep 13, 2026)

- The Guardian agent is **live in the published SmartBudget AI app** (built on Base44): deterministic engine, proactive alerts, dedup/suppression, Guardian Log audit trail, natural-language expense entry.
- Site upgraded with the **For banks** section: bank-collaboration pitch, verified CAC benchmark (US$65–90 per retail customer, Quinlan & Associates APAC Digital Bank Landscape via Fintech News HK, June 2023), Mox Bank validation, MAS FEAT + SAFR alignment.
- Privacy Policy & Terms of Service pages added to the app (current-state accurate; planned Open Banking capability clearly marked as not-yet-active, requiring fresh consent).
- Pitch deck outline: `../smartbudget-ai-prompt/pitch_deck_outline.md`.

## Linking the app and the site

- The site's Contact / demo sections should link to the **published app URL** (publish the app in the Base44 editor, then paste the public URL into `index.html` where `{{APP_URL}}` appears).
- Add a footer link in the app back to this site (`<repo GitHub Pages URL>`) so each surface points at the other.
