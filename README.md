# 4T Shop — Visitor Analytics Dashboard

A Grafana dashboard for tracking visitor behaviour and engagement on the 4T Shop website.

Built and maintained by [4T Technologies](https://4t-technologies.co.uk).

---

## What This Dashboard Shows

- **Unique Visitors** — distinct visitors over time
- **Page Views** — total page views per hour
- **Session Duration** — average time spent on site
- **Top Pages** — most visited pages ranked by views
- **Bounce Rate** — sessions with only a single page view
- **Geographic Distribution** — visitor locations (anonymised)
- **Device Breakdown** — desktop vs mobile vs tablet split
- **Referral Sources** — where visitors are coming from

All analytics are privacy-first:
- IP addresses are anonymised before storage
- No third-party tracking scripts
- Cookie consent gated — analytics only collected with explicit consent
- Data retained for 90 days

---

## Requirements

- Grafana 10+ (tested on 12.x)
- PostgreSQL datasource configured in Grafana
- The following tables in your PostgreSQL database:
  - `visitor_sessions` — one row per session
  - `page_views` — one row per page view

### Database Schema

```sql
CREATE TABLE visitor_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    visitor_id VARCHAR(255),
    ip_hash VARCHAR(64),
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    device_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE page_views (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES visitor_sessions(session_id),
    page_path TEXT NOT NULL,
    page_title TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Installation

1. In Grafana, go to **Dashboards → Import**
2. Upload `4t-visitor-analytics-public.json`
3. When prompted, map `${DS_POSTGRESQL}` to your PostgreSQL datasource
4. Click **Import**

---

## Customisation

The dashboard uses standard PostgreSQL queries and Grafana panels. All queries can be edited directly in the dashboard to match your own schema or time ranges.

Default time range is last 24 hours. All panels support the Grafana time picker for custom ranges.

---

## Tech Stack

- **Frontend**: React + Node.js (Express)
- **Analytics storage**: PostgreSQL (Neon serverless)
- **Visualisation**: Grafana 12
- **Hosting**: Replit

---

*Part of the 4T Technologies open infrastructure initiative.*
