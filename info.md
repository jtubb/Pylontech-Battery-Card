# Pylontech Battery Card

A comprehensive Lovelace card for monitoring Pylontech (SOK) BMS battery systems in Home Assistant.

## Features

- **System Overview**: Total voltage, power, cycles, and time estimates
- **Multi-Pack Display**: Monitor 1-16+ battery packs in a responsive grid
- **Interactive Heatmaps**: Click temperature or voltage labels to see cell-level heatmaps
- **History Graphs**: Click any metric to view historical data with mini-graph-card
- **Real-time Monitoring**: Live updates with visual SOC indicators
- **Responsive Design**: Optimized for desktop, tablet, and mobile

## Requirements

- Home Assistant 2024.1.0 or newer
- [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS)
- [mini-graph-card](https://github.com/kalkih/mini-graph-card) (for history graphs)

## Installation

**IMPORTANT:** After installing via HACS, you **must** add the resource:

### Via UI (Recommended)
1. Go to **Settings** → **Dashboards** → **Resources** (three-dot menu)
2. Click **"Add Resource"**
3. URL: `/hacsfiles/pylontech-battery-card/pylontech-battery-overview.js`
4. Type: **JavaScript Module**
5. Clear browser cache (Ctrl+Shift+R)

### Via configuration.yaml
```yaml
lovelace:
  resources:
    - url: /hacsfiles/pylontech-battery-card/pylontech-battery-overview.js
      type: module
```

## Quick Start

```yaml
type: custom:pylontech-battery-overview
entity_prefix: sensor.sok_rack_1
start_index: 1
end_index: 5
title: Battery System
```

## Troubleshooting

**"Custom element doesn't exist" error?**
→ You forgot to add the resource (see Installation above)

For more help:
- [Full Documentation](https://github.com/jtubb/pylontech-battery-card)
- [GitHub Issues](https://github.com/jtubb/pylontech-battery-card/issues)
- [Integration](https://github.com/jtubb/HA-Pylontech-BMS)
