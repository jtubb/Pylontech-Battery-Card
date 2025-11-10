# Pylontech Battery Card

A custom Lovelace card for displaying Pylontech (SOK) BMS battery information in Home Assistant.

![Pylontech Battery Card](https://via.placeholder.com/800x400?text=Screenshot+Coming+Soon)

## Features

- **Main Stats Display**: Voltage, current, state of charge, and power
- **Cell Voltage Monitoring**: Individual cell voltages with min/max highlighting
- **Temperature Monitoring**: Cell groups, MOSFET, and environment temperatures
- **Status Indicators**: System, protection, fault, and alarm statuses with visual alerts
- **Multi-Pack Support**: Works with multiple battery packs
- **Customizable Display**: Show/hide sections based on preferences
- **Responsive Design**: Adapts to different screen sizes

## Requirements

- Home Assistant 2024.1.0 or newer
- [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS) installed and configured

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
9. Restart Home Assistant

### Manual Installation

1. Download `pylontech-battery-card.js` from the [latest release](https://github.com/jtubb/pylontech-battery-card/releases)
2. Copy the file to `config/www/` directory (create if it doesn't exist)
3. Add the following to your Lovelace resources:
   ```yaml
   url: /local/pylontech-battery-card.js
   type: module
   ```
4. Restart Home Assistant

## Configuration

### Basic Configuration

Add the card to your Lovelace dashboard:

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
```

### Full Configuration

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
show_cells: true
show_temperatures: true
show_status: true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | Main pack voltage sensor entity ID (e.g., `sensor.pylontech_battery_pack_1_pack_voltage`) |
| `title` | string | `Battery Status` | Card title |
| `show_cells` | boolean | `true` | Show individual cell voltages |
| `show_temperatures` | boolean | `true` | Show temperature sensors |
| `show_status` | boolean | `true` | Show status indicators |

### Entity Selection

The card automatically finds related sensors based on the main entity you provide. For example, if you set:

```yaml
entity: sensor.pylontech_battery_pack_1_pack_voltage
```

The card will automatically look for:
- `sensor.pylontech_battery_pack_1_pack_current`
- `sensor.pylontech_battery_pack_1_state_of_charge`
- `sensor.pylontech_battery_pack_1_power`
- `sensor.pylontech_battery_pack_1_cell_0_voltage` through `cell_15_voltage`
- `sensor.pylontech_battery_pack_1_temp_cells_1_4` (and other temperature sensors)
- `sensor.pylontech_battery_pack_1_system_status` (and other status sensors)

## Examples

### Single Pack Display

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
```

### Multiple Packs (Using Vertical Stack)

```yaml
type: vertical-stack
cards:
  - type: custom:pylontech-battery-card
    entity: sensor.pylontech_battery_pack_1_pack_voltage
    title: Battery Pack 1
  - type: custom:pylontech-battery-card
    entity: sensor.pylontech_battery_pack_2_pack_voltage
    title: Battery Pack 2
  - type: custom:pylontech-battery-card
    entity: sensor.pylontech_battery_pack_3_pack_voltage
    title: Battery Pack 3
```

### Compact View (Main Stats Only)

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1
show_cells: false
show_temperatures: false
show_status: false
```

### Full Details View

```yaml
type: custom:pylontech-battery-card
entity: sensor.pylontech_battery_pack_1_pack_voltage
title: Battery Pack 1 - Full Details
show_cells: true
show_temperatures: true
show_status: true
```

## Visual Indicators

### Cell Voltages

- **Normal**: Default border color
- **Lowest Cell**: Red border (indicates lowest voltage in the pack)
- **Highest Cell**: Orange border (indicates highest voltage in the pack)

### Status Indicators

- **Normal**: Default appearance (when value is "Normal")
- **Alert**: Red border and background (when any alarm, fault, or protection is active)

## Troubleshooting

### Card Not Showing

1. Verify the Pylontech BMS integration is installed and working
2. Check that sensors are available in Developer Tools → States
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify the card is added to Lovelace resources

### Entity Not Found

1. Check entity ID format matches your integration
2. Entity ID should be the pack voltage sensor (e.g., `sensor.pylontech_battery_pack_1_pack_voltage`)
3. Verify entity exists in Developer Tools → States

### Incorrect Data Display

1. Verify integration is receiving data from BMS
2. Check entity states in Developer Tools
3. Ensure entity naming follows integration pattern

## Development

### Local Development

1. Clone the repository
2. Make changes to `pylontech-battery-card.js`
3. Copy to `config/www/` for testing
4. Refresh browser cache to see changes

### Building from Source

This card is written in vanilla JavaScript and doesn't require a build step. Simply edit the `.js` file directly.

## Support

- **Issues**: [GitHub Issues](https://github.com/jtubb/pylontech-battery-card/issues)
- **Integration**: [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Created for use with the [Pylontech BMS Integration](https://github.com/jtubb/HA-Pylontech-BMS) for Home Assistant.
