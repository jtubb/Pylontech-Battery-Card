# Pylontech Battery Card

Custom Lovelace cards for displaying Pylontech (SOK) BMS battery information in Home Assistant.

## Cards

This repository includes two cards for different use cases:

### Battery Overview Card (Multi-Pack System View)

A comprehensive system-level card for monitoring multiple battery packs with:
- System Overview: Total voltage, power, cycles, and time estimates
- Multi-Pack Display: Visual overview of all battery packs with SOC indicators
- Interactive Heatmaps: Click temperature or voltage labels to see cell-level heatmaps
- History Graphs: Click any entity to view historical data with mini-graph-card
- Responsive Design: Optimized layouts for desktop and mobile devices
- Real-time Monitoring: Live updates of all pack metrics

### Battery Card (Single Pack Detail View)

A detailed card for individual battery pack monitoring with:
- Main Stats Display: Voltage, current, state of charge, and power
- Cell Voltage Monitoring: Individual cell voltages with min/max highlighting
- Temperature Monitoring: Cell groups, MOSFET, and environment temperatures
- Status Indicators: System, protection, fault, and alarm statuses with visual alerts

## Requirements

- Home Assistant 2024.1.0 or newer
- [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS) installed and configured
- [mini-graph-card](https://github.com/kalkih/mini-graph-card) (required for Battery Overview Card history graphs)

## Installation

After installing through HACS, you'll need to add both card resources to your Lovelace configuration:

```yaml
resources:
  - url: /hacsfiles/pylontech-battery-card/pylontech-battery-overview.js
    type: module
  - url: /hacsfiles/pylontech-battery-card/pylontech-battery-card.js
    type: module
```

Also install mini-graph-card from HACS for full functionality.

## Support

For issues, feature requests, or questions:
- [GitHub Issues](https://github.com/jtubb/pylontech-battery-card/issues)
- [Integration Repository](https://github.com/jtubb/HA-Pylontech-BMS)
- [Documentation](https://github.com/jtubb/pylontech-battery-card/blob/main/README.md)
