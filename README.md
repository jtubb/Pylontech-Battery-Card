# Pylontech Battery Card

Custom Lovelace cards for displaying Pylontech (SOK) BMS battery information in Home Assistant.

## Cards

This repository includes two cards for different use cases:

### Battery Overview Card (Multi-Pack System View)

![Battery Overview Card](https://via.placeholder.com/800x500?text=Battery+Overview+Card+Screenshot)

A comprehensive system-level card for monitoring multiple battery packs with:
- **System Overview**: Total voltage, power, cycles, and time estimates
- **Multi-Pack Display**: Visual overview of all battery packs with SOC indicators
- **Interactive Heatmaps**: Click temperature or voltage labels to see cell-level heatmaps
- **History Graphs**: Click any entity to view historical data with mini-graph-card
- **Responsive Design**: Optimized layouts for desktop and mobile devices
- **Real-time Monitoring**: Live updates of all pack metrics

![Temperature Heatmap](https://via.placeholder.com/800x400?text=Temperature+Heatmap+Screenshot)
![Voltage Heatmap](https://via.placeholder.com/800x400?text=Voltage+Heatmap+Screenshot)
![History Graph](https://via.placeholder.com/800x400?text=History+Graph+Screenshot)

### Battery Card (Single Pack Detail View)

![Battery Card](https://via.placeholder.com/800x400?text=Battery+Card+Screenshot)

A detailed card for individual battery pack monitoring with:
- **Main Stats Display**: Voltage, current, state of charge, and power
- **Cell Voltage Monitoring**: Individual cell voltages with min/max highlighting
- **Temperature Monitoring**: Cell groups, MOSFET, and environment temperatures
- **Status Indicators**: System, protection, fault, and alarm statuses with visual alerts

## Requirements

- Home Assistant 2024.1.0 or newer
- [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS) installed and configured
- [mini-graph-card](https://github.com/kalkih/mini-graph-card) (required for Battery Overview Card history graphs)

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click the three dots in the top right corner
4. Select "Custom repositories"
5. Add this repository URL: `https://github.com/jtubb/pylontech-battery-card`
6. Select category: "Lovelace"
7. Click "Add"
8. Find "Pylontech Battery Card" in the list and click "Install"
9. Install [mini-graph-card](https://github.com/kalkih/mini-graph-card) from HACS (required for overview card)
10. Restart Home Assistant

### Manual Installation

1. Download the card files from the [latest release](https://github.com/jtubb/pylontech-battery-card/releases):
   - `pylontech-battery-overview.js` (multi-pack system view)
   - `pylontech-battery-card.js` (single pack detail view)
2. Copy the files to `config/www/` directory (create if it doesn't exist)
3. Install [mini-graph-card](https://github.com/kalkih/mini-graph-card) manually
4. Add the following to your Lovelace resources:
   ```yaml
   - url: /local/pylontech-battery-overview.js
     type: module
   - url: /local/pylontech-battery-card.js
     type: module
   - url: /local/mini-graph-card-bundle.js
     type: module
   ```
5. Restart Home Assistant

## Configuration

### Battery Overview Card (Multi-Pack System View)

#### Basic Configuration

```yaml
type: custom:pylontech-battery-overview
entity_prefix: sensor.sok_rack_1
start_index: 1
end_index: 5
title: Battery System Overview
```

#### Full Configuration

```yaml
type: custom:pylontech-battery-overview
entity_prefix: sensor.sok_rack_1
start_index: 1
end_index: 5
title: Battery System Overview
show_system_overview: true
show_packs: true
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity_prefix` | string | **required** | Entity prefix for your battery system (e.g., `sensor.sok_rack_1`) |
| `start_index` | number | `1` | Starting pack number to display |
| `end_index` | number | **required** | Ending pack number to display |
| `title` | string | `Battery System Overview` | Card title |
| `show_system_overview` | boolean | `true` | Show system overview section with totals |
| `show_packs` | boolean | `true` | Show individual pack cards |

#### Entity Naming Convention

The overview card expects entities to follow this naming pattern:
```
{entity_prefix}_pack_{N}_{metric}
```

Examples:
- `sensor.sok_rack_1_pack_1_pack_voltage`
- `sensor.sok_rack_1_pack_1_state_of_charge`
- `sensor.sok_rack_1_pack_1_temperature_cells_1_4`
- `sensor.sok_rack_1_pack_1_cell_0_voltage`

### Battery Card (Single Pack Detail View)

#### Basic Configuration

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
```

#### Full Configuration

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
show_cells: true
show_temperatures: true
show_status: true
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | Main pack voltage sensor entity ID |
| `title` | string | `Battery Status` | Card title |
| `show_cells` | boolean | `true` | Show individual cell voltages |
| `show_temperatures` | boolean | `true` | Show temperature sensors |
| `show_status` | boolean | `true` | Show status indicators |

## Examples

### System Overview with Multiple Packs

```yaml
type: custom:pylontech-battery-overview
entity_prefix: sensor.sok_rack_1
start_index: 1
end_index: 5
title: Main Battery System
```

### Combined View (Overview + Detail Cards)

```yaml
type: vertical-stack
cards:
  - type: custom:pylontech-battery-overview
    entity_prefix: sensor.sok_rack_1
    start_index: 1
    end_index: 5
    title: Battery System Overview
  - type: custom:pylontech-battery-card
    entity: sensor.pylontech_battery_pack_1_pack_voltage
    title: Pack 1 - Detailed View
```

### Single Pack Only

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
show_cells: true
show_temperatures: true
show_status: true
```

### Compact System View

```yaml
type: custom:pylontech-battery-overview
entity_prefix: sensor.sok_rack_1
start_index: 1
end_index: 3
title: Battery System
show_system_overview: true
```

## Features

### Battery Overview Card Features

- **System Statistics**: View total system voltage, power consumption/generation, average cycles, and time to empty/full
- **Multi-Pack Monitoring**: Display multiple battery packs (1-16+) in a responsive grid layout
- **State of Charge Visualization**: Visual SOC indicators with color coding (low/medium/normal)
- **Pack Metrics**: Voltage, current, power, delta V, and temperature for each pack
- **Interactive Heatmaps**:
  - Click "Temperature" label to view cell temperature heatmap
  - Click "Delta V" label to view cell voltage heatmap
  - Color-coded cells show min/max values
  - Click any cell to view its history graph
- **History Graphs**:
  - Powered by mini-graph-card
  - Zoom controls (1h, 3h, 6h, 12h, 24h)
  - Click any system stat or pack metric to view history
- **Alert Indicators**: Visual warnings for packs with alarms or faults
- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile devices
- **Real-time Updates**: Live data refresh from Home Assistant

### Battery Card Features

- **Main Statistics**: Voltage, current, state of charge, power
- **Cell Voltage Grid**: Individual cell voltages with min/max highlighting
- **Temperature Monitoring**: Cell groups, MOSFET, and environment sensors
- **Status Indicators**: System, protection, fault, and alarm statuses
- **Visual Alerts**: Highlight cells and statuses that need attention
- **Customizable Display**: Show/hide sections as needed

## Visual Indicators

### Overview Card

- **SOC Colors**:
  - Red: < 20%
  - Orange: 20-50%
  - Normal: > 50%
- **Pack Alerts**: Red border and warning icon for packs with active alarms
- **Heatmap Colors**: Gradient from blue (low) to red (high)
- **System Health**: Green checkmark or red warning icon

### Detail Card

- **Cell Voltages**:
  - Normal: Default border
  - Lowest: Red border
  - Highest: Orange border
- **Status Indicators**:
  - Normal: Default appearance
  - Alert: Red border and background

## Troubleshooting

### Card Not Showing

1. Verify the Pylontech BMS integration is installed and working
2. Check that sensors are available in Developer Tools → States
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify the cards are added to Lovelace resources
5. For overview card: Ensure mini-graph-card is installed

### Entity Not Found

1. Check entity ID format matches your integration
2. Verify entity prefix is correct (e.g., `sensor.sok_rack_1`)
3. Verify entity exists in Developer Tools → States
4. Check pack numbering matches your actual packs

### History Graphs Not Working

1. Ensure mini-graph-card is installed from HACS
2. Verify mini-graph-card is added to Lovelace resources
3. Check browser console for errors (F12)
4. Verify entity has recorded history data

### Heatmap Not Displaying

1. Verify cell entities exist (e.g., `sensor.sok_rack_1_pack_1_cell_0_voltage`)
2. Check entity naming follows the expected pattern
3. Ensure entities have valid numeric values
4. Check browser console for errors

## Development

### Local Development

1. Clone the repository
2. Make changes to the card files:
   - `pylontech-battery-overview.js` for multi-pack system view
   - `pylontech-battery-card.js` for single pack detail view
3. Copy to `config/www/` for testing
4. Refresh browser cache to see changes

### Building from Source

These cards are written in vanilla JavaScript and don't require a build step. Simply edit the `.js` files directly.

### Testing

Test on multiple screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## Support

- **Issues**: [GitHub Issues](https://github.com/jtubb/pylontech-battery-card/issues)
- **Integration**: [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS)
- **mini-graph-card**: [GitHub](https://github.com/kalkih/mini-graph-card)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple screen sizes
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

- Created for use with the [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS) for Home Assistant
- History graphs powered by [mini-graph-card](https://github.com/kalkih/mini-graph-card) by @kalkih

## Changelog

### Version 2.0.0
- Added Battery Overview Card for multi-pack system monitoring
- Integrated mini-graph-card for history visualization
- Added interactive temperature and voltage heatmaps
- Implemented responsive design for mobile and desktop
- Added system-level statistics (total power, cycles, time estimates)
- Optimized layout spacing and removed unnecessary icons
