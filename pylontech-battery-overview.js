/**
 * Pylontech Battery Overview Card - ISA-101 High Performance Design
 * Based on ISA-101 Human Machine Interface standards
 *
 * @version 3.0.1
 * @author jtubb
 */

const CARD_VERSION = '3.0.6';

console.info(
  `%c PYLONTECH-BATTERY-OVERVIEW %c v${CARD_VERSION} %c ISA-101 `,
  'color: #333; font-weight: bold; background: #d0d0d0',
  'color: #d0d0d0; font-weight: bold; background: #333',
  'color: #fff; font-weight: bold; background: #0066cc'
);

class PylontechBatteryOverview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity_prefix) {
      throw new Error('You need to define entity_prefix (e.g., "sensor.sok_rack_1")');
    }

    this.config = {
      title: config.title || 'BATTERY SYSTEM',
      entity_prefix: config.entity_prefix,
      pack_count: config.pack_count || 6,
      start_index: config.start_index || 1,
      // ISA-101 thresholds
      soc_warning: config.soc_warning || 30,
      soc_alarm: config.soc_alarm || 15,
      temp_warning: config.temp_warning || 40,
      temp_alarm: config.temp_alarm || 50,
      delta_v_warning: config.delta_v_warning || 30,
      delta_v_alarm: config.delta_v_alarm || 50,
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
        :host {
          /* ISA-101 Color Palette */
          --isa-bg: #d4d4d4;
          --isa-bg-panel: #e8e8e8;
          --isa-bg-dark: #b8b8b8;
          --isa-border: #999999;
          --isa-text: #1a1a1a;
          --isa-text-dim: #666666;

          /* Status Colors - ISA-101 compliant */
          --isa-normal: #808080;
          --isa-abnormal: #0088cc;
          --isa-warning: #cc8800;
          --isa-alarm: #cc0000;

          font-family: 'Segoe UI', 'Arial', sans-serif;
          font-size: 13px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ha-card {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          overflow: hidden;
        }

        .hmi-container {
          background: var(--isa-bg);
          border: 1px solid var(--isa-border);
          border-radius: 4px;
          padding: 8px;
        }

        /* Header */
        .hmi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: var(--isa-bg-dark);
          border: 1px solid var(--isa-border);
          margin-bottom: 8px;
        }
        .hmi-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--isa-text);
          letter-spacing: 1px;
        }
        .health-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 0;
          font-size: 11px;
          font-weight: 600;
        }
        .health-indicator.level-0 { background: var(--isa-normal); color: #fff; }
        .health-indicator.level-1 { background: var(--isa-abnormal); color: #fff; }
        .health-indicator.level-2 { background: var(--isa-warning); color: #fff; }
        .health-indicator.level-3 { background: var(--isa-alarm); color: #fff; animation: alarm-flash 1s infinite; }

        @keyframes alarm-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* System Overview */
        .system-overview {
          display: flex;
          gap: 6px;
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          padding: 10px;
          margin-bottom: 8px;
        }
        .system-stat {
          flex: 1;
          background: var(--isa-bg);
          border: 1px solid var(--isa-border);
          padding: 8px;
          text-align: center;
          cursor: pointer;
        }
        .system-stat:hover {
          background: var(--isa-bg-dark);
        }
        .system-label {
          font-size: 10px;
          color: var(--isa-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .system-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--isa-text);
        }
        .system-unit {
          font-size: 11px;
          color: var(--isa-text-dim);
          margin-left: 2px;
        }

        /* Pack Grid */
        .packs-section {
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          padding: 10px;
        }
        .packs-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Pack Card */
        .pack-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: var(--isa-bg);
          border: 1px solid var(--isa-border);
          padding: 8px;
          overflow: hidden;
        }
        .pack-card.level-2 {
          border-color: var(--isa-warning);
          border-width: 2px;
        }
        .pack-card.level-3 {
          border-color: var(--isa-alarm);
          border-width: 2px;
        }

        /* Pack Top Row */
        .pack-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pack-header {
          min-width: 55px;
          cursor: pointer;
        }
        .pack-header:hover {
          opacity: 0.8;
        }
        .pack-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--isa-text);
        }
        .pack-alert {
          font-size: 10px;
          color: var(--isa-alarm);
          font-weight: 600;
        }

        /* SOC Bar - Horizontal Analog Style */
        .soc-container {
          flex: 1;
          height: 24px;
          background: #fff;
          border: 2px solid var(--isa-border);
          position: relative;
          cursor: pointer;
        }
        .soc-container:hover {
          border-color: var(--isa-text);
        }
        .soc-fill {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          transition: width 0.3s ease;
        }
        .soc-fill.level-0 { background: var(--isa-normal); }
        .soc-fill.level-1 { background: var(--isa-abnormal); }
        .soc-fill.level-2 { background: var(--isa-warning); }
        .soc-fill.level-3 { background: var(--isa-alarm); }
        .soc-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8);
          z-index: 1;
        }

        /* Pack Flow in top row */
        .pack-flow {
          margin-left: auto;
        }

        /* Pack Stats Row */
        .pack-stats {
          display: flex;
          gap: 4px;
          min-width: 0;
          overflow: hidden;
        }
        .pack-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 6px;
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          cursor: pointer;
          min-width: 0;
        }
        .pack-stat:hover {
          background: var(--isa-bg-dark);
        }
        .pack-stat-label {
          font-size: 9px;
          color: var(--isa-text-dim);
          text-transform: uppercase;
        }
        .pack-stat-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--isa-text);
        }
        .pack-stat-value.level-0 { color: var(--isa-text); }
        .pack-stat-value.level-1 { color: var(--isa-abnormal); }
        .pack-stat-value.level-2 { color: var(--isa-warning); }
        .pack-stat-value.level-3 { color: var(--isa-alarm); }

        /* Flow Indicator */
        .flow-indicator {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 0;
          font-size: 10px;
          font-weight: 600;
        }
        .flow-indicator.charging { background: var(--isa-abnormal); color: #fff; }
        .flow-indicator.discharging { background: var(--isa-warning); color: #fff; }
        .flow-indicator.idle { background: var(--isa-normal); color: #fff; }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--isa-bg);
          border: 2px solid var(--isa-border);
          border-radius: 0;
          padding: 0;
          max-width: 90%;
          max-height: 90%;
          overflow: auto;
          min-width: 320px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--isa-bg-dark);
          border-bottom: 1px solid var(--isa-border);
        }
        .modal-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--isa-text);
        }
        .modal-close {
          cursor: pointer;
          font-size: 20px;
          color: var(--isa-text);
          background: none;
          border: 1px solid var(--isa-border);
          padding: 2px 8px;
          border-radius: 0;
        }
        .modal-close:hover {
          background: var(--isa-alarm);
          color: #fff;
          border-color: var(--isa-alarm);
        }
        .modal-body {
          padding: 12px;
        }
        .modal-back {
          cursor: pointer;
          font-size: 12px;
          color: var(--isa-text);
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          padding: 4px 10px;
          border-radius: 0;
        }
        .modal-back:hover {
          background: var(--isa-abnormal);
          color: #fff;
        }

        /* Heatmap Grid */
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .heatmap-grid.four-col {
          grid-template-columns: repeat(4, 1fr);
        }
        .heatmap-cell {
          aspect-ratio: 1;
          border: 1px solid var(--isa-border);
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .heatmap-cell:hover {
          border-color: var(--isa-text);
          border-width: 2px;
        }
        .heatmap-cell-number {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 4px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }
        .heatmap-cell-value {
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }

        /* Heatmap Legend */
        .heatmap-legend {
          display: flex;
          justify-content: space-between;
          padding: 8px 10px;
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          margin-top: 10px;
          font-size: 12px;
        }
        .legend-item {
          display: flex;
          gap: 6px;
        }
        .legend-item span {
          color: var(--isa-text-dim);
        }
        .legend-item strong {
          color: var(--isa-text);
        }

        /* Status Grid */
        .status-grid {
          display: grid;
          gap: 8px;
        }
        .status-item {
          background: var(--isa-bg-panel);
          padding: 10px;
          border: 1px solid var(--isa-border);
        }
        .status-item.level-2 {
          border-color: var(--isa-warning);
          background: rgba(204, 136, 0, 0.1);
        }
        .status-item.level-3 {
          border-color: var(--isa-alarm);
          background: rgba(204, 0, 0, 0.1);
        }
        .status-label {
          font-size: 10px;
          color: var(--isa-text-dim);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .status-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--isa-text);
        }

        /* History Controls */
        .history-controls {
          display: flex;
          gap: 6px;
          padding: 10px;
          justify-content: center;
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          margin-top: 10px;
        }
        .history-zoom {
          cursor: pointer;
          padding: 6px 12px;
          border: 1px solid var(--isa-border);
          background: var(--isa-bg);
          color: var(--isa-text);
          font-size: 12px;
          font-weight: 500;
        }
        .history-zoom:hover {
          background: var(--isa-abnormal);
          color: #fff;
          border-color: var(--isa-abnormal);
        }
        .history-graph-container {
          background: var(--isa-bg-panel);
          border: 1px solid var(--isa-border);
          padding: 10px;
          min-height: 200px;
        }

        /* Footer */
        .hmi-footer {
          font-size: 10px;
          color: var(--isa-text-dim);
          text-align: center;
          padding-top: 8px;
          margin-top: 8px;
          border-top: 1px solid var(--isa-border);
        }

        /* Unavailable */
        .unavailable-text {
          text-align: center;
          color: var(--isa-text-dim);
          padding: 20px;
          font-size: 14px;
        }

        /* Mobile responsive */
        @media (max-width: 600px) {
          .system-overview {
            flex-wrap: wrap;
          }
          .system-stat {
            flex: 1 1 calc(50% - 4px);
            min-width: 80px;
          }
          .pack-stats {
            flex-wrap: wrap;
          }
          .pack-stat {
            flex: 1 1 calc(33% - 4px);
            border-right: none;
            border-bottom: 1px solid var(--isa-border);
          }
          .pack-stat:last-child {
            border-bottom: none;
          }
        }
      </style>
      <ha-card>
        <div class="hmi-container">
          <div class="hmi-header">
            <span class="hmi-title">${this.config.title}</span>
            <div class="health-indicator level-0" id="health-indicator">
              <span id="health-text">NORMAL</span>
            </div>
          </div>
          <div id="content"></div>
          <div id="modal"></div>
        </div>
      </ha-card>
    `;
  }

  updateContent() {
    if (!this._hass || !this.config) return;

    const contentDiv = this.shadowRoot.getElementById('content');
    if (!contentDiv) return;

    // Calculate system totals
    let totalPower = 0;
    let totalCurrent = 0;
    let totalRemainingCapacity = 0;
    let totalCapacity = 0;
    let maxDeltaV = 0;
    let totalCycles = 0;
    let cyclesCount = 0;
    let alertCount = 0;
    let availablePackCount = 0;
    let systemVoltage = 'N/A';

    const endIndex = this.config.start_index + this.config.pack_count - 1;

    for (let packNum = this.config.start_index; packNum <= endIndex; packNum++) {
      const packData = this.getPackData(packNum);
      if (packData.available) {
        availablePackCount++;
        if (systemVoltage === 'N/A') systemVoltage = packData.voltage;
        if (packData.power !== 'N/A') totalPower += parseFloat(packData.power);
        if (packData.current !== 'N/A') totalCurrent += parseFloat(packData.current);
        if (packData.remainingCapacity !== 'N/A') totalRemainingCapacity += parseFloat(packData.remainingCapacity);
        if (packData.totalCapacity !== 'N/A') totalCapacity += parseFloat(packData.totalCapacity);
        if (packData.deltaV !== 'N/A') {
          const deltaV = parseFloat(packData.deltaV);
          if (deltaV > maxDeltaV) maxDeltaV = deltaV;
        }
        if (packData.cycles !== 'N/A') {
          totalCycles += parseFloat(packData.cycles);
          cyclesCount++;
        }
      }
      if (this.hasAlert(packNum)) alertCount++;
    }

    const averageCycles = cyclesCount > 0 ? Math.round(totalCycles / cyclesCount) : 0;

    // Update health indicator
    const healthIndicator = this.shadowRoot.getElementById('health-indicator');
    const healthText = this.shadowRoot.getElementById('health-text');
    if (alertCount > 0) {
      healthIndicator.className = 'health-indicator level-3';
      healthText.textContent = `${alertCount} ALERT${alertCount > 1 ? 'S' : ''}`;
    } else {
      healthIndicator.className = 'health-indicator level-0';
      healthText.textContent = 'NORMAL';
    }

    // Flow state
    const flowState = this.getFlowState(totalCurrent);

    // Calculate time estimate
    let timeEstimate = '';
    if (totalPower !== 0 && systemVoltage !== 'N/A') {
      const voltageValue = parseFloat(systemVoltage);
      if (totalPower > 0 && totalCapacity > 0) {
        const capacityNeeded = totalCapacity - totalRemainingCapacity;
        const energyNeeded = capacityNeeded * voltageValue;
        const hoursToFull = energyNeeded / totalPower;
        if (hoursToFull > 0 && hoursToFull < 1000) {
          timeEstimate = `Full: ${this.formatTime(hoursToFull)}`;
        }
      } else if (totalPower < 0 && totalRemainingCapacity > 0) {
        const energyRemaining = totalRemainingCapacity * voltageValue;
        const hoursToEmpty = energyRemaining / Math.abs(totalPower);
        if (hoursToEmpty > 0 && hoursToEmpty < 1000) {
          timeEstimate = `Empty: ${this.formatTime(hoursToEmpty)}`;
        }
      }
    }

    // System overview
    const systemVoltageEntity = `${this.config.entity_prefix}_pack_${this.config.start_index}_pack_voltage`;
    const totalPowerEntity = `${this.config.entity_prefix}_pack_${this.config.start_index}_power`;

    let html = `
      <div class="system-overview">
        <div class="system-stat" data-entity="${systemVoltageEntity}">
          <div class="system-label">Voltage</div>
          <div class="system-value">${systemVoltage}<span class="system-unit">V</span></div>
        </div>
        <div class="system-stat" data-entity="${totalPowerEntity}">
          <div class="system-label">Power</div>
          <div class="system-value">${Math.round(totalPower)}<span class="system-unit">W</span></div>
        </div>
        <div class="system-stat">
          <div class="system-label">Status</div>
          <div class="system-value"><span class="flow-indicator ${flowState.class}">${flowState.text}</span></div>
        </div>
        ${averageCycles > 0 ? `
        <div class="system-stat">
          <div class="system-label">Cycles</div>
          <div class="system-value">${averageCycles}</div>
        </div>
        ` : ''}
        ${timeEstimate ? `
        <div class="system-stat">
          <div class="system-label">Estimate</div>
          <div class="system-value" style="font-size: 14px;">${timeEstimate}</div>
        </div>
        ` : ''}
      </div>
    `;

    // Pack cards
    html += '<div class="packs-section"><div class="packs-grid">';

    for (let packNum = this.config.start_index; packNum <= endIndex; packNum++) {
      const packData = this.getPackData(packNum);
      if (!packData.available) continue;

      const hasAlert = this.hasAlert(packNum);
      const alertLevel = hasAlert ? 3 : 0;
      const socLevel = this.getSocLevel(packData.soc);
      const tempLevel = this.getTempLevel(parseFloat(packData.avgTemp), packData.tempUnit);
      const deltaVLevel = this.getDeltaVLevel(parseFloat(packData.deltaV));
      const flowState = this.getFlowState(packData.current);

      html += `
        <div class="pack-card ${alertLevel > 0 ? 'level-' + alertLevel : ''}">
          <div class="pack-top-row">
            <div class="pack-header" data-pack="${packNum}">
              <div class="pack-title">PACK ${packNum}</div>
              ${hasAlert ? '<div class="pack-alert">ALERT</div>' : ''}
            </div>
            <div class="soc-container" data-pack="${packNum}" data-entity="${this.config.entity_prefix}_pack_${packNum}_state_of_charge">
              <div class="soc-fill level-${socLevel}" style="width: ${packData.soc}%"></div>
              <div class="soc-label">${packData.soc}%</div>
            </div>
            <div class="pack-flow">
              <span class="flow-indicator ${flowState.class}">${flowState.text}</span>
            </div>
          </div>
          <div class="pack-stats">
            <div class="pack-stat" data-pack="${packNum}" data-type="temp">
              <span class="pack-stat-label">Temp</span>
              <span class="pack-stat-value level-${tempLevel}">${packData.avgTemp}${packData.tempUnit}</span>
            </div>
            <div class="pack-stat" data-entity="${this.config.entity_prefix}_pack_${packNum}_power">
              <span class="pack-stat-label">Power</span>
              <span class="pack-stat-value">${packData.power}W</span>
            </div>
            <div class="pack-stat" data-pack="${packNum}" data-type="voltage">
              <span class="pack-stat-label">ΔV</span>
              <span class="pack-stat-value level-${deltaVLevel}">${packData.deltaV}mV</span>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div></div>';

    if (availablePackCount === 0) {
      html = '<div class="unavailable-text">No battery packs available</div>';
    }

    // Footer
    html += `
      <div class="hmi-footer">
        ${availablePackCount} Pack${availablePackCount !== 1 ? 's' : ''} Online |
        ${totalRemainingCapacity.toFixed(1)} / ${totalCapacity.toFixed(1)} Ah
      </div>
    `;

    contentDiv.innerHTML = html;

    // Add event listeners
    this.addEventListeners();
  }

  addEventListeners() {
    // System stats - history click
    this.shadowRoot.querySelectorAll('.system-stat[data-entity]').forEach(el => {
      el.addEventListener('click', () => {
        const entityId = el.getAttribute('data-entity');
        if (entityId) this.showHistory(entityId);
      });
    });

    // SOC containers - history click
    this.shadowRoot.querySelectorAll('.soc-container').forEach(el => {
      el.addEventListener('click', () => {
        const entityId = el.getAttribute('data-entity');
        if (entityId) this.showHistory(entityId);
      });
    });

    // Pack headers - status click
    this.shadowRoot.querySelectorAll('.pack-header').forEach(el => {
      el.addEventListener('click', () => {
        const packNum = parseInt(el.getAttribute('data-pack'));
        this.showPackStatus(packNum);
      });
    });

    // Pack stats with type - heatmap click
    this.shadowRoot.querySelectorAll('.pack-stat[data-type]').forEach(el => {
      el.addEventListener('click', () => {
        const packNum = parseInt(el.getAttribute('data-pack'));
        const type = el.getAttribute('data-type');
        if (type === 'voltage') {
          this.showVoltageHeatMap(packNum);
        } else if (type === 'temp') {
          this.showTemperatureHeatMap(packNum);
        }
      });
    });

    // Pack stats with entity - history click
    this.shadowRoot.querySelectorAll('.pack-stat[data-entity]').forEach(el => {
      el.addEventListener('click', () => {
        const entityId = el.getAttribute('data-entity');
        if (entityId) this.showHistory(entityId);
      });
    });
  }

  getPackData(packNum) {
    const prefix = `${this.config.entity_prefix}_pack_${packNum}`;

    const getState = (suffix) => {
      const entity = this._hass.states[`${prefix}_${suffix}`];
      return entity && entity.state !== 'unavailable' ? entity.state : null;
    };

    const voltageState = getState('pack_voltage');
    const available = voltageState !== null;

    const avgTempEntity = this._hass.states[`${prefix}_average_temperature`];
    const tempUnit = avgTempEntity?.attributes?.unit_of_measurement || '°C';

    let deltaV = 'N/A';
    const highV = getState('highest_cell_voltage');
    const lowV = getState('lowest_cell_voltage');
    if (highV && lowV) {
      deltaV = ((parseFloat(highV) - parseFloat(lowV)) * 1000).toFixed(0);
    }

    return {
      available,
      voltage: available ? parseFloat(voltageState).toFixed(1) : 'N/A',
      current: getState('pack_current') ? parseFloat(getState('pack_current')).toFixed(1) : 'N/A',
      soc: getState('state_of_charge') ? parseInt(getState('state_of_charge')) : 0,
      power: getState('power') ? Math.round(parseFloat(getState('power'))) : 'N/A',
      avgTemp: getState('average_temperature') ? parseFloat(getState('average_temperature')).toFixed(1) : 'N/A',
      tempUnit,
      deltaV,
      remainingCapacity: getState('remaining_capacity') ? parseFloat(getState('remaining_capacity')) : 'N/A',
      totalCapacity: getState('total_capacity') ? parseFloat(getState('total_capacity')) : 'N/A',
      cycles: getState('cycle_count') ? parseFloat(getState('cycle_count')) : 'N/A'
    };
  }

  hasAlert(packNum) {
    const statusSensors = ['system_status', 'protect_status', 'fault_status', 'alarm_status'];
    for (const sensor of statusSensors) {
      const entity = this._hass.states[`${this.config.entity_prefix}_pack_${packNum}_${sensor}`];
      if (entity && entity.state !== 'unavailable' && entity.state !== 'Normal') {
        return true;
      }
    }
    return false;
  }

  getFlowState(current) {
    const val = parseFloat(current);
    if (isNaN(val) || Math.abs(val) < 0.1) {
      return { class: 'idle', text: 'IDLE' };
    } else if (val > 0) {
      return { class: 'charging', text: 'CHG' };
    } else {
      return { class: 'discharging', text: 'DCHG' };
    }
  }

  getSocLevel(soc) {
    if (soc <= this.config.soc_alarm) return 3;
    if (soc <= this.config.soc_warning) return 2;
    return 0;
  }

  getTempLevel(temp, unit) {
    // Convert to Celsius if in Fahrenheit (thresholds are in Celsius)
    let tempC = temp;
    if (unit && unit.includes('F')) {
      tempC = (temp - 32) * 5 / 9;
    }
    if (tempC >= this.config.temp_alarm) return 3;
    if (tempC >= this.config.temp_warning) return 2;
    return 0;
  }

  getDeltaVLevel(deltaV) {
    if (deltaV >= this.config.delta_v_alarm) return 3;
    if (deltaV >= this.config.delta_v_warning) return 2;
    return 0;
  }

  getCellTemperatures(packNum) {
    const tempGroups = [
      { id: 'temperature_cells_1_4', label: 'Cells 1-4' },
      { id: 'temperature_cells_5_8', label: 'Cells 5-8' },
      { id: 'temperature_cells_9_12', label: 'Cells 9-12' },
      { id: 'temperature_cells_13_16', label: 'Cells 13-16' }
    ];

    const cells = [];
    let unit = '°C';

    tempGroups.forEach(group => {
      const entity = this._hass.states[`${this.config.entity_prefix}_pack_${packNum}_${group.id}`];
      if (entity && entity.state !== 'unavailable') {
        if (entity.attributes?.unit_of_measurement) unit = entity.attributes.unit_of_measurement;
        cells.push({
          label: group.label,
          temperature: parseFloat(entity.state),
          entityId: `${this.config.entity_prefix}_pack_${packNum}_${group.id}`
        });
      }
    });

    return { cells, unit };
  }

  getCellVoltages(packNum) {
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const entity = this._hass.states[`${this.config.entity_prefix}_pack_${packNum}_cell_${i}_voltage`];
      if (entity && entity.state !== 'unavailable') {
        cells.push({
          number: i,
          voltage: parseFloat(entity.state),
          entityId: `${this.config.entity_prefix}_pack_${packNum}_cell_${i}_voltage`
        });
      }
    }
    return cells;
  }

  getHeatmapColor(normalized) {
    // ISA-101 compliant gradient: blue-gray (cool/low) -> gray (normal) -> amber-red (hot/high)
    // Uses muted industrial colors rather than bright saturated colors
    if (normalized < 0.5) {
      // Cool to neutral: blue-gray (#6699aa) -> gray (#999999)
      const t = normalized * 2; // 0 to 1
      const r = Math.round(102 + t * 51);   // 102 -> 153
      const g = Math.round(153 + t * 0);    // 153 -> 153
      const b = Math.round(170 - t * 17);   // 170 -> 153
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Neutral to warm: gray (#999999) -> amber (#cc8800) -> red (#cc4400)
      const t = (normalized - 0.5) * 2; // 0 to 1
      const r = Math.round(153 + t * 51);   // 153 -> 204
      const g = Math.round(153 - t * 85);   // 153 -> 68
      const b = Math.round(153 - t * 153);  // 153 -> 0
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  showTemperatureHeatMap(packNum) {
    const { cells, unit } = this.getCellTemperatures(packNum);
    if (cells.length === 0) return;

    const temps = cells.map(c => c.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = maxTemp - minTemp || 1;

    let html = '<div class="heatmap-grid">';
    cells.forEach(cell => {
      const normalized = (cell.temperature - minTemp) / range;
      const color = this.getHeatmapColor(normalized);
      html += `
        <div class="heatmap-cell" data-entity="${cell.entityId}" style="background-color: ${color};">
          <div class="heatmap-cell-number">${cell.label}</div>
          <div class="heatmap-cell-value">${cell.temperature.toFixed(1)}${unit}</div>
        </div>
      `;
    });
    html += '</div>';

    html += `
      <div class="heatmap-legend">
        <div class="legend-item"><span>Min:</span> <strong>${minTemp.toFixed(1)}${unit}</strong></div>
        <div class="legend-item"><span>Max:</span> <strong>${maxTemp.toFixed(1)}${unit}</strong></div>
        <div class="legend-item"><span>Range:</span> <strong>${(maxTemp - minTemp).toFixed(1)}${unit}</strong></div>
      </div>
    `;

    this.showModal(`Pack ${packNum} - Temperature`, html, packNum, 'temperature');
  }

  showVoltageHeatMap(packNum) {
    const cells = this.getCellVoltages(packNum);
    if (cells.length === 0) return;

    const voltages = cells.map(c => c.voltage);
    const minV = Math.min(...voltages);
    const maxV = Math.max(...voltages);
    const range = maxV - minV || 0.001;

    let html = '<div class="heatmap-grid four-col">';
    cells.forEach(cell => {
      const normalized = (cell.voltage - minV) / range;
      const color = this.getHeatmapColor(normalized);
      const diffMv = Math.round((cell.voltage - minV) * 1000);
      const display = diffMv === 0 ? `${cell.voltage.toFixed(3)}V` : `+${diffMv}mV`;
      html += `
        <div class="heatmap-cell" data-entity="${cell.entityId}" style="background-color: ${color};">
          <div class="heatmap-cell-number">Cell ${cell.number}</div>
          <div class="heatmap-cell-value">${display}</div>
        </div>
      `;
    });
    html += '</div>';

    const deltaVmv = Math.round(range * 1000);
    html += `
      <div class="heatmap-legend">
        <div class="legend-item"><span>Min:</span> <strong>${minV.toFixed(3)}V</strong></div>
        <div class="legend-item"><span>Max:</span> <strong>${maxV.toFixed(3)}V</strong></div>
        <div class="legend-item"><span>ΔV:</span> <strong>${deltaVmv}mV</strong></div>
      </div>
    `;

    this.showModal(`Pack ${packNum} - Cell Voltage`, html, packNum, 'voltage');
  }

  showPackStatus(packNum) {
    const statusSensors = [
      { id: 'system_status', label: 'System Status' },
      { id: 'protect_status', label: 'Protection Status' },
      { id: 'fault_status', label: 'Fault Status' },
      { id: 'alarm_status', label: 'Alarm Status' }
    ];

    let html = '<div class="status-grid">';
    statusSensors.forEach(sensor => {
      const entity = this._hass.states[`${this.config.entity_prefix}_pack_${packNum}_${sensor.id}`];
      if (entity && entity.state !== 'unavailable') {
        const isAlert = entity.state !== 'Normal' && entity.state !== 'normal';
        const level = isAlert ? 3 : 0;
        html += `
          <div class="status-item ${level > 0 ? 'level-' + level : ''}">
            <div class="status-label">${sensor.label}</div>
            <div class="status-value">${entity.state}</div>
          </div>
        `;
      }
    });
    html += '</div>';

    this.showModal(`Pack ${packNum} - Status`, html);
  }

  showModal(title, bodyHtml, packNum = null, type = null) {
    const modalDiv = this.shadowRoot.getElementById('modal');

    const backButton = packNum && type ? `<button class="modal-back" id="backBtn">← Back</button>` : '';

    modalDiv.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            ${backButton}
            <div class="modal-title">${title}</div>
            <button class="modal-close" id="closeModal">×</button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
        </div>
      </div>
    `;

    // Close handlers
    this.shadowRoot.getElementById('closeModal').addEventListener('click', () => {
      modalDiv.innerHTML = '';
    });
    this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) modalDiv.innerHTML = '';
    });

    // Back button
    const backBtn = this.shadowRoot.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (type === 'temperature') this.showTemperatureHeatMap(packNum);
        else if (type === 'voltage') this.showVoltageHeatMap(packNum);
      });
    }

    // Heatmap cell clicks for history
    this.shadowRoot.querySelectorAll('.heatmap-cell[data-entity]').forEach(cell => {
      cell.addEventListener('click', () => {
        const entityId = cell.getAttribute('data-entity');
        if (entityId) this.showEntityHistoryInModal(entityId, packNum, type);
      });
    });
  }

  showEntityHistoryInModal(entityId, packNum, type) {
    const entity = this._hass.states[entityId];
    const name = entity?.attributes?.friendly_name || entityId;

    let html = `
      <div class="history-graph-container" id="historyGraph">Loading...</div>
      <div class="history-controls">
        <button class="history-zoom" data-hours="1">1h</button>
        <button class="history-zoom" data-hours="3">3h</button>
        <button class="history-zoom" data-hours="6">6h</button>
        <button class="history-zoom" data-hours="12">12h</button>
        <button class="history-zoom" data-hours="24">24h</button>
      </div>
    `;

    this.showModal(name, html, packNum, type);

    // Zoom buttons
    this.shadowRoot.querySelectorAll('.history-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        const hours = parseInt(btn.getAttribute('data-hours'));
        this.loadHistoryGraph(entityId, hours);
      });
    });

    this.loadHistoryGraph(entityId, 1);
  }

  loadHistoryGraph(entityId, hours) {
    const container = this.shadowRoot.getElementById('historyGraph');
    if (!container) return;

    if (!this._hass.states[entityId]) {
      container.innerHTML = `<div style="padding: 20px; color: var(--isa-alarm);">Entity not found</div>`;
      return;
    }

    if (!customElements.get('mini-graph-card')) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <strong>mini-graph-card required</strong><br>
          <a href="https://github.com/kalkih/mini-graph-card" target="_blank" style="color: var(--isa-abnormal);">Install from HACS</a>
        </div>
      `;
      return;
    }

    const card = document.createElement('mini-graph-card');
    card.setConfig({
      entities: [entityId],
      hours_to_show: hours,
      points_per_hour: 60,
      line_width: 2,
      animate: true,
      show: { name: false, icon: false, state: true, graph: 'line' }
    });
    card.hass = this._hass;

    container.innerHTML = '';
    container.appendChild(card);
  }

  showHistory(entityId) {
    const event = new Event('hass-more-info', { bubbles: true, composed: true });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  formatTime(hours) {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const days = Math.floor(hours / 24);
    const h = Math.round(hours % 24);
    return h > 0 ? `${days}d ${h}h` : `${days}d`;
  }

  getCardSize() {
    return 4 + this.config.pack_count;
  }

  static getStubConfig() {
    return {
      entity_prefix: "sensor.pylontech_rack_1",
      title: "BATTERY SYSTEM",
      pack_count: 6,
      start_index: 1
    };
  }
}

customElements.define('pylontech-battery-overview', PylontechBatteryOverview);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'pylontech-battery-overview',
  name: 'Pylontech Battery Overview',
  description: 'ISA-101 compliant battery system overview',
  preview: true,
  documentationURL: 'https://github.com/jtubb/Pylontech-Battery-Card'
});
