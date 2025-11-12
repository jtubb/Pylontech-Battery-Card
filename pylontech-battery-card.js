const CARD_VERSION = '2.0.0';

class PylontechBatteryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }

    this.config = {
      title: config.title || 'Battery Status',
      show_cells: config.show_cells !== false,
      show_temperatures: config.show_temperatures !== false,
      show_status: config.show_status !== false,
      pack_entity: config.entity, // Main pack entity (e.g., sensor.pylontech_battery_pack_1_pack_voltage)
      ...config
    };

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateContent();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .title {
          font-size: 24px;
          font-weight: 500;
        }
        .main-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: var(--primary-background-color);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--divider-color);
        }
        .stat-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 500;
        }
        .stat-unit {
          font-size: 14px;
          color: var(--secondary-text-color);
          margin-left: 4px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 500;
          margin: 20px 0 12px 0;
          color: var(--primary-text-color);
        }
        .cells-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
          margin-bottom: 20px;
        }
        .cell {
          background: var(--primary-background-color);
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--divider-color);
          text-align: center;
        }
        .cell-label {
          font-size: 10px;
          color: var(--secondary-text-color);
        }
        .cell-value {
          font-size: 14px;
          font-weight: 500;
          margin-top: 4px;
        }
        .cell.low {
          border-color: var(--error-color);
          background: rgba(244, 67, 54, 0.1);
        }
        .cell.high {
          border-color: var(--warning-color);
          background: rgba(255, 152, 0, 0.1);
        }
        .temps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .status-grid {
          display: grid;
          gap: 12px;
        }
        .status-item {
          background: var(--primary-background-color);
          padding: 12px;
          border-radius: 6px;
          border: 1px solid var(--divider-color);
        }
        .status-item.alert {
          border-color: var(--error-color);
          background: rgba(244, 67, 54, 0.1);
        }
        .status-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 6px;
        }
        .status-value {
          font-size: 14px;
          font-weight: 500;
        }
        .error {
          color: var(--error-color);
          padding: 16px;
          text-align: center;
        }
      </style>
      <ha-card>
        <div class="header">
          <div class="title">${this.config.title}</div>
        </div>
        <div id="content"></div>
      </ha-card>
    `;
  }

  updateContent() {
    if (!this._hass || !this.config) return;

    const contentDiv = this.shadowRoot.getElementById('content');
    if (!contentDiv) return;

    // Extract pack number from entity (e.g., sensor.pylontech_battery_pack_1_pack_voltage -> pack_1)
    const packMatch = this.config.pack_entity.match(/pack_(\d+)/);
    if (!packMatch) {
      contentDiv.innerHTML = '<div class="error">Invalid pack entity format</div>';
      return;
    }

    const packNum = packMatch[1];
    const basePrefix = this.config.pack_entity.replace(/pack_voltage$/, '');

    // Get main stats
    const voltage = this.getEntityState(`${basePrefix}pack_voltage`);
    const current = this.getEntityState(`${basePrefix}pack_current`);
    const soc = this.getEntityState(`${basePrefix}state_of_charge`);
    const power = this.getEntityState(`${basePrefix}power`);

    let html = `
      <div class="main-stats">
        <div class="stat-card">
          <div class="stat-label">Voltage</div>
          <div class="stat-value">${voltage || 'N/A'}<span class="stat-unit">V</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current</div>
          <div class="stat-value">${current || 'N/A'}<span class="stat-unit">A</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">State of Charge</div>
          <div class="stat-value">${soc || 'N/A'}<span class="stat-unit">%</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Power</div>
          <div class="stat-value">${power || 'N/A'}<span class="stat-unit">W</span></div>
        </div>
      </div>
    `;

    // Cell voltages
    if (this.config.show_cells) {
      const cellVoltages = this.getCellVoltages(basePrefix);
      if (cellVoltages.length > 0) {
        html += '<div class="section-title">Cell Voltages</div>';
        html += '<div class="cells-grid">';

        const minVoltage = Math.min(...cellVoltages.map(c => c.value));
        const maxVoltage = Math.max(...cellVoltages.map(c => c.value));

        cellVoltages.forEach(cell => {
          let cellClass = 'cell';
          if (cell.value === minVoltage) cellClass += ' low';
          if (cell.value === maxVoltage) cellClass += ' high';

          html += `
            <div class="${cellClass}">
              <div class="cell-label">${cell.label}</div>
              <div class="cell-value">${cell.value.toFixed(3)}V</div>
            </div>
          `;
        });
        html += '</div>';
      }
    }

    // Temperatures
    if (this.config.show_temperatures) {
      const temps = this.getTemperatures(basePrefix);
      if (temps.length > 0) {
        html += '<div class="section-title">Temperatures</div>';
        html += '<div class="temps-grid">';
        temps.forEach(temp => {
          html += `
            <div class="stat-card">
              <div class="stat-label">${temp.label}</div>
              <div class="stat-value">${temp.value}<span class="stat-unit">°C</span></div>
            </div>
          `;
        });
        html += '</div>';
      }
    }

    // Status indicators
    if (this.config.show_status) {
      const statuses = this.getStatuses(basePrefix);
      if (statuses.length > 0) {
        html += '<div class="section-title">Status</div>';
        html += '<div class="status-grid">';
        statuses.forEach(status => {
          const hasAlert = status.value !== 'Normal' && status.value !== 'normal';
          html += `
            <div class="status-item ${hasAlert ? 'alert' : ''}">
              <div class="status-label">${status.label}</div>
              <div class="status-value">${status.value}</div>
            </div>
          `;
        });
        html += '</div>';
      }
    }

    contentDiv.innerHTML = html;
  }

  getEntityState(entityId) {
    const state = this._hass.states[entityId];
    return state ? state.state : null;
  }

  getCellVoltages(basePrefix) {
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const entityId = `${basePrefix}cell_${i}_voltage`;
      const state = this.getEntityState(entityId);
      if (state && state !== 'unavailable') {
        cells.push({
          label: `Cell ${i}`,
          value: parseFloat(state)
        });
      }
    }
    return cells;
  }

  getTemperatures(basePrefix) {
    const tempSensors = [
      { id: 'temp_cells_1_4', label: 'Cells 1-4' },
      { id: 'temp_cells_5_8', label: 'Cells 5-8' },
      { id: 'temp_cells_9_12', label: 'Cells 9-12' },
      { id: 'temp_cells_13_16', label: 'Cells 13-16' },
      { id: 'temp_mos', label: 'MOSFET' },
      { id: 'temp_env', label: 'Environment' }
    ];

    const temps = [];
    tempSensors.forEach(sensor => {
      const entityId = `${basePrefix}${sensor.id}`;
      const state = this.getEntityState(entityId);
      if (state && state !== 'unavailable') {
        temps.push({
          label: sensor.label,
          value: parseFloat(state).toFixed(1)
        });
      }
    });
    return temps;
  }

  getStatuses(basePrefix) {
    const statusSensors = [
      { id: 'system_status', label: 'System Status' },
      { id: 'protect_status', label: 'Protection Status' },
      { id: 'fault_status', label: 'Fault Status' },
      { id: 'alarm_status', label: 'Alarm Status' }
    ];

    const statuses = [];
    statusSensors.forEach(sensor => {
      const entityId = `${basePrefix}${sensor.id}`;
      const state = this.getEntityState(entityId);
      if (state && state !== 'unavailable') {
        statuses.push({
          label: sensor.label,
          value: state
        });
      }
    });
    return statuses;
  }

  getCardSize() {
    return 5;
  }

  static getConfigElement() {
    return document.createElement("pylontech-battery-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.pylontech_battery_pack_1_pack_voltage",
      title: "Battery Pack 1"
    };
  }
}

customElements.define('pylontech-battery-card', PylontechBatteryCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'pylontech-battery-card',
  name: 'Pylontech Battery Card',
  description: 'Display Pylontech BMS battery information',
  preview: true,
  documentationURL: 'https://github.com/jtubb/pylontech-battery-card'
});

console.info(
  `%c  PYLONTECH-BATTERY-CARD  %c Version ${CARD_VERSION} `,
  'color: white; background: green; font-weight: 700;',
  'color: green; background: white; font-weight: 700;'
);
