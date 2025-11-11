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
      title: config.title || 'Battery System',
      entity_prefix: config.entity_prefix,
      pack_count: config.pack_count || 6, // Default to 6 packs
      start_index: config.start_index || 1, // Default to start at pack 1
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
          padding: 20px;
        }
        .header {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 16px;
          letter-spacing: -0.3px;
        }
        .system-overview {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: linear-gradient(135deg, var(--primary-background-color) 0%, var(--card-background-color) 100%);
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid var(--divider-color);
          align-items: center;
          flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .system-stat {
          display: flex;
          flex-direction: column;
          position: relative;
          min-width: 80px;
          flex: 0 1 auto;
          padding-right: 10px;
          border-right: 1px solid var(--divider-color);
          align-items: center;
        }
        .system-stat.history-clickable {
          cursor: pointer;
        }
        .system-stat.history-clickable:hover {
          opacity: 0.8;
        }
        .system-stat:last-of-type {
          border-right: none;
        }
        .system-health {
          margin-left: auto;
          position: relative;
          flex-shrink: 0;
        }
        .system-health ha-icon {
          --mdc-icon-size: 28px;
        }
        .health-good {
          color: var(--success-color);
          filter: drop-shadow(0 0 4px rgba(76, 175, 80, 0.3));
        }
        .health-alert {
          color: var(--error-color);
          filter: drop-shadow(0 0 4px rgba(244, 67, 54, 0.3));
        }
        .system-label {
          font-size: 10px;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
          white-space: nowrap;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .system-value {
          font-size: 17px;
          font-weight: 600;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .system-unit {
          font-size: 11px;
          color: var(--secondary-text-color);
          margin-left: 1px;
          font-weight: 400;
        }
        .packs-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pack-card {
          background: var(--primary-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          min-height: 56px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        .pack-card.alert {
          border-color: var(--error-color);
          border-width: 2px;
        }
        .pack-header {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 70px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .pack-header:hover {
          opacity: 0.8;
        }
        .pack-title {
          font-size: 14px;
          font-weight: 600;
        }
        .alert-icon {
          color: var(--error-color);
          font-size: 14px;
        }
        .soc-chart {
          width: 40px;
          height: 34px;
          background: var(--divider-color);
          border-radius: 4px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
        }
        .soc-chart:hover {
          opacity: 0.8;
        }
        .soc-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: var(--success-color);
          transition: height 0.3s ease;
        }
        .soc-fill.low {
          background: var(--error-color);
        }
        .soc-fill.medium {
          background: var(--warning-color);
        }
        .soc-label {
          font-size: 11px;
          font-weight: 700;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-shadow:
            -1px -1px 0 rgba(0,0,0,0.8),
            1px -1px 0 rgba(0,0,0,0.8),
            -1px 1px 0 rgba(0,0,0,0.8),
            1px 1px 0 rgba(0,0,0,0.8),
            0 0 4px rgba(0,0,0,0.9);
        }
        .pack-stats {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
        }
        .pack-stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          white-space: nowrap;
          padding-right: 8px;
          border-right: 1px solid var(--divider-color);
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
        }
        .pack-stat:last-child {
          border-right: none;
          padding-right: 0;
        }
        .pack-stat ha-icon {
          --mdc-icon-size: 14px;
          color: var(--secondary-text-color);
          flex-shrink: 0;
        }
        .pack-stat ha-icon.flow-icon {
          --mdc-icon-size: 16px;
          margin-left: 1px;
        }
        .pack-stat ha-icon.flow-icon.charging {
          color: var(--success-color);
          filter: drop-shadow(0 0 3px rgba(76, 175, 80, 0.4));
        }
        .pack-stat ha-icon.flow-icon.discharging {
          color: var(--warning-color);
          filter: drop-shadow(0 0 3px rgba(255, 152, 0, 0.4));
        }
        .pack-stat ha-icon.flow-icon.idle {
          color: var(--secondary-text-color);
        }
        .pack-stat-label {
          color: var(--secondary-text-color);
          font-weight: 500;
          flex-shrink: 0;
        }
        .pack-stat-value {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .unavailable-text {
          text-align: center;
          color: var(--secondary-text-color);
          padding: 20px;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          ha-card {
            padding: 12px;
          }
          .header {
            font-size: 18px;
            margin-bottom: 12px;
          }
          .system-overview {
            gap: 6px;
            padding: 10px;
            flex-wrap: wrap;
            overflow: hidden;
          }
          .system-stat {
            flex: 0 1 calc(50% - 6px);
            min-width: 0;
            padding-right: 0;
            border-right: none;
            padding-bottom: 8px;
            margin-bottom: 8px;
            border-bottom: 1px solid var(--divider-color);
          }
          .system-stat:nth-last-child(-n+2) {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }
          .system-health {
            flex: 0 0 100%;
            margin-left: 0;
            text-align: center;
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }
          .system-label {
            font-size: 9px;
            letter-spacing: 0.2px;
          }
          .system-value {
            font-size: 16px;
          }
          .system-unit {
            font-size: 10px;
          }
          .pack-card {
            padding: 8px;
            gap: 4px;
            flex-wrap: nowrap;
            min-height: auto;
          }
          .pack-header {
            min-width: 50px;
            flex-shrink: 0;
          }
          .pack-title {
            font-size: 12px;
          }
          .soc-chart {
            width: 30px;
            height: 28px;
          }
          .soc-label {
            font-size: 9px;
          }
          .pack-stats {
            flex: 1 1 0;
            gap: 4px;
            min-width: 0;
          }
          .pack-stat {
            font-size: 10px;
            gap: 2px;
            padding-right: 4px;
            flex: 1 1 0;
            min-width: 0;
          }
          .pack-stat ha-icon {
            --mdc-icon-size: 11px;
          }
          .pack-stat ha-icon.flow-icon {
            --mdc-icon-size: 13px;
          }
          .pack-stat-value {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .system-stat {
            flex: 0 1 100%;
            min-width: 0;
          }
          .system-stat:not(:last-child) {
            border-bottom: 1px solid var(--divider-color);
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .pack-card {
            padding: 6px;
            gap: 3px;
          }
          .pack-header {
            min-width: 45px;
          }
          .pack-title {
            font-size: 11px;
          }
          .soc-chart {
            width: 28px;
            height: 26px;
          }
          .pack-stats {
            gap: 3px;
          }
          .pack-stat {
            font-size: 9px;
            gap: 2px;
            padding-right: 3px;
          }
          .pack-stat ha-icon {
            --mdc-icon-size: 10px;
          }
          .pack-stat ha-icon.flow-icon {
            --mdc-icon-size: 12px;
          }
        }

        .temp-clickable {
          cursor: pointer;
        }
        .temp-clickable:hover {
          opacity: 0.8;
        }
        .history-clickable {
          cursor: pointer;
        }
        .history-clickable:hover {
          opacity: 0.8;
        }
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
          background: var(--card-background-color);
          border-radius: 8px;
          padding: 20px;
          max-width: 90%;
          max-height: 90%;
          overflow: auto;
          position: relative;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 500;
        }
        .modal-close {
          cursor: pointer;
          font-size: 24px;
          color: var(--secondary-text-color);
          background: none;
          border: none;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover {
          color: var(--primary-text-color);
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .heatmap-cell {
          aspect-ratio: 1;
          border-radius: 6px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--divider-color);
          transition: transform 0.2s;
        }
        .heatmap-cell:hover {
          transform: scale(1.05);
          border-color: var(--primary-color);
        }
        .heatmap-clickable {
          cursor: pointer;
        }
        .heatmap-cell-number {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 4px;
        }
        .heatmap-cell-temp {
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-shadow: 0 0 3px rgba(0,0,0,0.8);
        }
        .heatmap-legend {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding: 8px;
          background: var(--primary-background-color);
          border-radius: 4px;
          font-size: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-grid {
          display: grid;
          gap: 12px;
          margin-top: 16px;
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
        .modal-back {
          cursor: pointer;
          font-size: 14px;
          color: var(--primary-color);
          background: none;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: 500;
        }
        .modal-back:hover {
          background: var(--primary-color);
          color: white;
        }
        .history-controls {
          display: flex;
          gap: 8px;
          padding: 12px;
          justify-content: center;
          background: var(--primary-background-color);
          border-radius: 8px;
          margin-top: 16px;
        }
        .history-zoom {
          cursor: pointer;
          padding: 8px 16px;
          border: 1px solid var(--divider-color);
          background: var(--card-background-color);
          color: var(--primary-text-color);
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .history-zoom:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        .history-graph-container {
          overflow: auto;
          margin-bottom: 16px;
        }
      </style>
      <ha-card>
        <div class="header">${this.config.title}</div>
        <div id="content"></div>
        <div id="modal"></div>
      </ha-card>
    `;
  }

  updateContent() {
    if (!this._hass || !this.config) return;

    const contentDiv = this.shadowRoot.getElementById('content');
    if (!contentDiv) return;

    // Get system-wide data from pack 1
    const pack1Data = this.getPackData(1);
    const systemVoltage = pack1Data.voltage;
    const systemVoltageEntity = `${this.config.entity_prefix}_pack_1_pack_voltage`;
    const totalPowerEntity = `${this.config.entity_prefix}_pack_1_power`; // Using pack 1 as representative

    // Calculate total power, capacity, health, max delta V, and cycles across all packs
    let totalPower = 0;
    let totalCurrent = 0;
    let totalRemainingCapacity = 0;
    let totalCapacity = 0;
    let maxDeltaV = 0;
    let totalCycles = 0;
    let cyclesCount = 0;
    let alertCount = 0;
    let availablePackCount = 0;
    const endIndex = this.config.start_index + this.config.pack_count - 1;
    for (let packNum = this.config.start_index; packNum <= endIndex; packNum++) {
      const packData = this.getPackData(packNum);
      if (packData.available) {
        availablePackCount++;
        if (packData.power !== 'N/A') {
          totalPower += parseFloat(packData.power);
        }
        if (packData.current !== 'N/A') {
          totalCurrent += parseFloat(packData.current);
        }
        if (packData.remainingCapacity !== 'N/A') {
          totalRemainingCapacity += parseFloat(packData.remainingCapacity);
        }
        if (packData.totalCapacity !== 'N/A') {
          totalCapacity += parseFloat(packData.totalCapacity);
        }
        if (packData.deltaV !== 'N/A') {
          const deltaV = parseFloat(packData.deltaV);
          if (deltaV > maxDeltaV) {
            maxDeltaV = deltaV;
          }
        }
        if (packData.cycles !== 'N/A') {
          totalCycles += parseFloat(packData.cycles);
          cyclesCount++;
        }
      }
      // Check for alerts
      if (this.hasAlert(packNum)) {
        alertCount++;
      }
    }

    // Calculate average cycles
    const averageCycles = cyclesCount > 0 ? Math.round(totalCycles / cyclesCount) : 0;

    // Determine system health
    let healthIcon = 'mdi:check-circle';
    let healthClass = 'health-good';
    let healthTooltip = 'All systems normal';
    if (alertCount > 0) {
      healthIcon = 'mdi:alert-circle';
      healthClass = 'health-alert';
      healthTooltip = `${alertCount} pack${alertCount > 1 ? 's' : ''} with alerts`;
    }

    // Determine total flow state
    const totalFlowState = this.getFlowState(totalCurrent);
    const totalFlowClass = totalFlowState.class;
    const totalFlowIcon = totalFlowState.icon;

    // Calculate estimated time to charge or discharge
    let estimatedTime = 'N/A';
    let timeLabel = '';
    if (totalPower !== 0 && (totalRemainingCapacity > 0 || totalCapacity > 0)) {
      const systemVoltageValue = parseFloat(systemVoltage);

      if (totalPower > 0) {
        // Charging - calculate time to full based on remaining capacity needed
        const capacityNeeded = totalCapacity - totalRemainingCapacity; // Ah
        const energyNeeded = capacityNeeded * systemVoltageValue; // Wh
        const hoursToFull = energyNeeded / totalPower;
        if (hoursToFull > 0 && hoursToFull < 1000) {
          estimatedTime = this.formatTime(hoursToFull);
          timeLabel = 'Time to Full';
        }
      } else if (totalPower < 0) {
        // Discharging - calculate time to empty based on remaining capacity
        const energyRemaining = totalRemainingCapacity * systemVoltageValue; // Wh
        const hoursToEmpty = energyRemaining / Math.abs(totalPower);
        if (hoursToEmpty > 0 && hoursToEmpty < 1000) {
          estimatedTime = this.formatTime(hoursToEmpty);
          timeLabel = 'Time to Empty';
        }
      }
    }

    // System overview section
    let html = `
      <div class="system-overview">
        <div class="system-stat history-clickable" data-entity="${systemVoltageEntity}">
          <div class="system-label">System Voltage</div>
          <div class="system-value">${systemVoltage}<span class="system-unit">V</span></div>
        </div>
        <div class="system-stat history-clickable" data-entity="${totalPowerEntity}">
          <div class="system-label">Total Power</div>
          <div class="system-value">
            ${Math.round(totalPower)}<span class="system-unit">W</span>
          </div>
        </div>
        ${averageCycles > 0 ? `
        <div class="system-stat">
          <div class="system-label">Cycles</div>
          <div class="system-value">${averageCycles}</div>
        </div>
        ` : ''}
        ${estimatedTime !== 'N/A' ? `
        <div class="system-stat">
          <div class="system-label">${timeLabel}</div>
          <div class="system-value">${estimatedTime}</div>
        </div>
        ` : ''}
        <div class="system-health">
          <ha-icon icon="${healthIcon}" class="${healthClass}"></ha-icon>
        </div>
      </div>
    `;

    html += '<div class="packs-grid">';

    // Loop through each pack starting from start_index
    for (let packNum = this.config.start_index; packNum <= endIndex; packNum++) {
      const packData = this.getPackData(packNum);

      if (!packData.available) {
        continue; // Skip unavailable packs
      }

      const hasAlert = this.hasAlert(packNum);
      const alertClass = hasAlert ? 'alert' : '';
      const alertIcon = hasAlert ? '<span class="alert-icon">⚠️</span>' : '';

      // Determine flow state
      const flowState = this.getFlowState(packData.current);
      const flowClass = flowState.class;
      const flowIcon = flowState.icon;

      // SOC color class
      let socClass = '';
      if (packData.soc < 20) socClass = 'low';
      else if (packData.soc < 50) socClass = 'medium';

      html += `
        <div class="pack-card ${alertClass}">
          <div class="pack-header" data-pack="${packNum}">
            <div class="pack-title">Pack ${packNum}</div>
            ${alertIcon}
          </div>
          <div class="soc-chart" data-pack="${packNum}" data-entity="${this.config.entity_prefix}_pack_${packNum}_state_of_charge">
            <div class="soc-fill ${socClass}" style="height: ${packData.soc}%"></div>
            <div class="soc-label">${packData.soc}%</div>
          </div>
          <div class="pack-stats">
            <div class="pack-stat temp-clickable" data-pack="${packNum}">
              <ha-icon icon="mdi:thermometer"></ha-icon>
              <span class="pack-stat-value">${packData.avgTemp}${packData.tempUnit}</span>
            </div>
            <div class="pack-stat history-clickable" data-entity="${this.config.entity_prefix}_pack_${packNum}_power">
              <ha-icon icon="mdi:lightning-bolt"></ha-icon>
              <span class="pack-stat-value">${packData.power}W</span>
              <ha-icon icon="${flowIcon}" class="flow-icon ${flowClass}"></ha-icon>
            </div>
            <div class="pack-stat temp-clickable" data-pack="${packNum}" data-type="voltage">
              <span class="pack-stat-label">ΔV:</span>
              <span class="pack-stat-value">${packData.deltaV}mV</span>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';

    // Show message if no packs are available
    if (!html.includes('pack-card')) {
      html = '<div class="unavailable-text">No battery packs available</div>';
    }

    contentDiv.innerHTML = html;

    // Add event listeners to clickable elements
    const clickableElements = this.shadowRoot.querySelectorAll('.temp-clickable');
    clickableElements.forEach(el => {
      el.addEventListener('click', (e) => {
        const packNum = parseInt(el.getAttribute('data-pack'));
        const type = el.getAttribute('data-type');

        if (type === 'voltage') {
          this.showVoltageHeatMap(packNum);
        } else {
          this.showTemperatureHeatMap(packNum);
        }
      });
    });

    // Add event listeners to SOC charts
    const socCharts = this.shadowRoot.querySelectorAll('.soc-chart');
    socCharts.forEach(el => {
      el.addEventListener('click', (e) => {
        const entityId = el.getAttribute('data-entity');
        this.showHistory(entityId);
      });
    });

    // Add event listeners to history-clickable elements
    const historyElements = this.shadowRoot.querySelectorAll('.history-clickable');
    historyElements.forEach(el => {
      el.addEventListener('click', (e) => {
        const entityId = el.getAttribute('data-entity');
        this.showHistory(entityId);
      });
    });

    // Add event listeners to pack headers
    const packHeaders = this.shadowRoot.querySelectorAll('.pack-header');
    packHeaders.forEach(el => {
      el.addEventListener('click', (e) => {
        const packNum = parseInt(el.getAttribute('data-pack'));
        this.showPackStatus(packNum);
      });
    });
  }

  getPackData(packNum) {
    const voltageEntity = `${this.config.entity_prefix}_pack_${packNum}_pack_voltage`;
    const currentEntity = `${this.config.entity_prefix}_pack_${packNum}_pack_current`;
    const socEntity = `${this.config.entity_prefix}_pack_${packNum}_state_of_charge`;
    const powerEntity = `${this.config.entity_prefix}_pack_${packNum}_power`;
    const avgTempEntity = `${this.config.entity_prefix}_pack_${packNum}_average_temperature`;
    const highCellVoltEntity = `${this.config.entity_prefix}_pack_${packNum}_highest_cell_voltage`;
    const lowCellVoltEntity = `${this.config.entity_prefix}_pack_${packNum}_lowest_cell_voltage`;
    const remainingCapacityEntity = `${this.config.entity_prefix}_pack_${packNum}_remaining_capacity`;
    const totalCapacityEntity = `${this.config.entity_prefix}_pack_${packNum}_total_capacity`;
    const cycleCountEntity = `${this.config.entity_prefix}_pack_${packNum}_cycle_count`;

    const voltageState = this._hass.states[voltageEntity];
    const currentState = this._hass.states[currentEntity];
    const socState = this._hass.states[socEntity];
    const powerState = this._hass.states[powerEntity];
    const avgTempState = this._hass.states[avgTempEntity];
    const highCellVoltState = this._hass.states[highCellVoltEntity];
    const lowCellVoltState = this._hass.states[lowCellVoltEntity];
    const remainingCapacityState = this._hass.states[remainingCapacityEntity];
    const totalCapacityState = this._hass.states[totalCapacityEntity];
    const cycleCountState = this._hass.states[cycleCountEntity];

    const available = voltageState && voltageState.state !== 'unavailable';

    // Get units from entity attributes
    const tempUnit = avgTempState?.attributes?.unit_of_measurement || '°C';

    // Calculate Delta V in millivolts
    let deltaV = 'N/A';
    if (highCellVoltState && lowCellVoltState &&
        highCellVoltState.state !== 'unavailable' && lowCellVoltState.state !== 'unavailable') {
      const highV = parseFloat(highCellVoltState.state);
      const lowV = parseFloat(lowCellVoltState.state);
      // Convert to millivolts (multiply by 1000)
      deltaV = ((highV - lowV) * 1000).toFixed(0);
    }

    return {
      available,
      voltage: available ? parseFloat(voltageState.state).toFixed(1) : 'N/A',
      current: available ? parseFloat(currentState?.state || 0).toFixed(1) : 'N/A',
      soc: available ? parseInt(socState?.state || 0) : 0,
      power: available ? Math.round(parseFloat(powerState?.state || 0)) : 'N/A',
      avgTemp: available ? parseFloat(avgTempState?.state || 0).toFixed(1) : 'N/A',
      tempUnit: tempUnit,
      deltaV: deltaV,
      remainingCapacity: (remainingCapacityState && remainingCapacityState.state !== 'unavailable')
        ? parseFloat(remainingCapacityState.state) : 'N/A',
      totalCapacity: (totalCapacityState && totalCapacityState.state !== 'unavailable')
        ? parseFloat(totalCapacityState.state) : 'N/A',
      cycles: (cycleCountState && cycleCountState.state !== 'unavailable')
        ? parseFloat(cycleCountState.state) : 'N/A'
    };
  }

  hasAlert(packNum) {
    const statusSensors = [
      `${this.config.entity_prefix}_pack_${packNum}_system_status`,
      `${this.config.entity_prefix}_pack_${packNum}_protect_status`,
      `${this.config.entity_prefix}_pack_${packNum}_fault_status`,
      `${this.config.entity_prefix}_pack_${packNum}_alarm_status`
    ];

    for (const sensorId of statusSensors) {
      const state = this._hass.states[sensorId];
      if (state && state.state !== 'unavailable' && state.state !== 'Normal') {
        return true;
      }
    }

    return false;
  }

  getFlowState(current) {
    const currentVal = parseFloat(current);

    if (isNaN(currentVal) || Math.abs(currentVal) < 0.1) {
      return {
        class: 'idle',
        icon: 'mdi:pause-circle-outline'
      };
    } else if (currentVal > 0) {
      return {
        class: 'charging',
        icon: 'mdi:battery-charging'
      };
    } else {
      return {
        class: 'discharging',
        icon: 'mdi:battery-arrow-down'
      };
    }
  }

  getCellTemperatures(packNum) {
    const tempGroups = [
      { id: 'temperature_cells_1_4', label: 'Cells 1-4' },
      { id: 'temperature_cells_5_8', label: 'Cells 5-8' },
      { id: 'temperature_cells_9_12', label: 'Cells 9-12' },
      { id: 'temperature_cells_13_16', label: 'Cells 13-16' }
    ];

    const cells = [];
    let unit = '°C'; // Default unit

    tempGroups.forEach(group => {
      const tempEntity = `${this.config.entity_prefix}_pack_${packNum}_${group.id}`;
      const tempState = this._hass.states[tempEntity];

      if (tempState && tempState.state !== 'unavailable') {
        // Get unit from entity attributes
        if (tempState.attributes && tempState.attributes.unit_of_measurement) {
          unit = tempState.attributes.unit_of_measurement;
        }

        cells.push({
          label: group.label,
          temperature: parseFloat(tempState.state),
          entityId: tempEntity
        });
      }
    });

    return { cells, unit };
  }

  getTemperatureColor(temp, minTemp, maxTemp) {
    // Normalize temperature to 0-1 range
    const range = maxTemp - minTemp;
    if (range === 0) return 'rgb(100, 200, 100)'; // All same temp, use neutral green

    const normalized = (temp - minTemp) / range;

    // Color gradient from cool (blue-green) to hot (red)
    if (normalized < 0.33) {
      // Cool: blue to green
      const r = Math.round(50 + normalized * 3 * 100);
      const g = Math.round(150 + normalized * 3 * 50);
      const b = Math.round(200 - normalized * 3 * 100);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (normalized < 0.66) {
      // Medium: green to yellow
      const adjusted = (normalized - 0.33) * 3;
      const r = Math.round(150 + adjusted * 105);
      const g = 200;
      const b = Math.round(100 - adjusted * 100);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Hot: yellow to red
      const adjusted = (normalized - 0.66) * 3;
      const r = 255;
      const g = Math.round(200 - adjusted * 150);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  showTemperatureHeatMap(packNum) {
    const result = this.getCellTemperatures(packNum);
    const cells = result.cells;
    const unit = result.unit;

    if (cells.length === 0) {
      return; // No temperature data available
    }

    // Find min and max temperatures for color scaling
    const temps = cells.map(c => c.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    // Build heat map HTML
    let heatMapHtml = '<div class="heatmap-grid">';

    cells.forEach(cell => {
      const color = this.getTemperatureColor(cell.temperature, minTemp, maxTemp);
      heatMapHtml += `
        <div class="heatmap-cell heatmap-clickable" data-entity="${cell.entityId}" style="background-color: ${color};">
          <div class="heatmap-cell-number">${cell.label}</div>
          <div class="heatmap-cell-temp">${cell.temperature.toFixed(1)}${unit}</div>
        </div>
      `;
    });

    heatMapHtml += '</div>';

    // Add legend
    heatMapHtml += `
      <div class="heatmap-legend">
        <div class="legend-item">
          <span>Coolest:</span>
          <strong>${minTemp.toFixed(1)}${unit}</strong>
        </div>
        <div class="legend-item">
          <span>Hottest:</span>
          <strong>${maxTemp.toFixed(1)}${unit}</strong>
        </div>
        <div class="legend-item">
          <span>Range:</span>
          <strong>${(maxTemp - minTemp).toFixed(1)}${unit}</strong>
        </div>
      </div>
    `;

    // Display modal
    const modalDiv = this.shadowRoot.getElementById('modal');
    modalDiv.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">Pack ${packNum} - Cell Temperature Heat Map</div>
            <button class="modal-close" id="closeModal">×</button>
          </div>
          ${heatMapHtml}
        </div>
      </div>
    `;

    // Add close event listener
    const closeBtn = this.shadowRoot.getElementById('closeModal');
    const overlay = this.shadowRoot.querySelector('.modal-overlay');

    closeBtn.addEventListener('click', () => {
      modalDiv.innerHTML = '';
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        modalDiv.innerHTML = '';
      }
    });

    // Add click handlers to heatmap cells
    const heatmapCells = this.shadowRoot.querySelectorAll('.heatmap-clickable');
    heatmapCells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const entityId = cell.getAttribute('data-entity');
        if (entityId) {
          // Show history graph in the same modal
          this.showEntityHistoryInModal(entityId, packNum, 'temperature');
        }
      });
    });
  }

  getCellVoltages(packNum) {
    const cells = [];

    // Try to get individual cell voltages (typically 16 cells, numbered 0-15)
    for (let i = 0; i < 16; i++) {
      const voltEntity = `${this.config.entity_prefix}_pack_${packNum}_cell_${i}_voltage`;
      const voltState = this._hass.states[voltEntity];

      if (voltState && voltState.state !== 'unavailable') {
        cells.push({
          number: i,
          voltage: parseFloat(voltState.state),
          entityId: voltEntity
        });
      }
    }

    return cells;
  }

  getVoltageColor(voltageDiff, maxDiff) {
    // Normalize voltage difference to 0-1 range
    if (maxDiff === 0) return 'rgb(100, 200, 100)'; // All same voltage, use neutral green

    const normalized = voltageDiff / maxDiff;

    // Color gradient from cool (blue-green) for lowest to hot (yellow-red) for highest
    if (normalized < 0.33) {
      // Cool: blue to green (lowest voltages)
      const r = Math.round(50 + normalized * 3 * 100);
      const g = Math.round(150 + normalized * 3 * 50);
      const b = Math.round(200 - normalized * 3 * 100);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (normalized < 0.66) {
      // Medium: green to yellow
      const adjusted = (normalized - 0.33) * 3;
      const r = Math.round(150 + adjusted * 105);
      const g = 200;
      const b = Math.round(100 - adjusted * 100);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Hot: yellow to red (highest voltages)
      const adjusted = (normalized - 0.66) * 3;
      const r = 255;
      const g = Math.round(200 - adjusted * 150);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  showVoltageHeatMap(packNum) {
    const cells = this.getCellVoltages(packNum);

    if (cells.length === 0) {
      return; // No voltage data available
    }

    // Find min and max voltages
    const voltages = cells.map(c => c.voltage);
    const minVoltage = Math.min(...voltages);
    const maxVoltage = Math.max(...voltages);
    const maxDiff = maxVoltage - minVoltage;

    // Build heat map HTML
    let heatMapHtml = '<div class="heatmap-grid" style="grid-template-columns: repeat(4, 1fr);">';

    cells.forEach(cell => {
      const voltageDiff = cell.voltage - minVoltage;
      const voltageDiffMv = Math.round(voltageDiff * 1000);
      const color = this.getVoltageColor(voltageDiff, maxDiff);

      // For the lowest cell, show actual voltage, for others show mV difference
      const displayValue = voltageDiff === 0
        ? `${cell.voltage.toFixed(3)}V`
        : `+${voltageDiffMv}mV`;

      heatMapHtml += `
        <div class="heatmap-cell heatmap-clickable" data-entity="${cell.entityId}" style="background-color: ${color};">
          <div class="heatmap-cell-number">Cell ${cell.number}</div>
          <div class="heatmap-cell-temp">${displayValue}</div>
        </div>
      `;
    });

    heatMapHtml += '</div>';

    // Add legend
    const deltaVmv = Math.round(maxDiff * 1000);
    heatMapHtml += `
      <div class="heatmap-legend">
        <div class="legend-item">
          <span>Lowest:</span>
          <strong>${minVoltage.toFixed(3)}V</strong>
        </div>
        <div class="legend-item">
          <span>Highest:</span>
          <strong>${maxVoltage.toFixed(3)}V</strong>
        </div>
        <div class="legend-item">
          <span>ΔV:</span>
          <strong>${deltaVmv}mV</strong>
        </div>
      </div>
    `;

    // Display modal
    const modalDiv = this.shadowRoot.getElementById('modal');
    modalDiv.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">Pack ${packNum} - Cell Voltage Heat Map</div>
            <button class="modal-close" id="closeModal">×</button>
          </div>
          ${heatMapHtml}
        </div>
      </div>
    `;

    // Add close event listener
    const closeBtn = this.shadowRoot.getElementById('closeModal');
    const overlay = this.shadowRoot.querySelector('.modal-overlay');

    closeBtn.addEventListener('click', () => {
      modalDiv.innerHTML = '';
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        modalDiv.innerHTML = '';
      }
    });

    // Add click handlers to heatmap cells
    const heatmapCells = this.shadowRoot.querySelectorAll('.heatmap-clickable');
    heatmapCells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const entityId = cell.getAttribute('data-entity');
        if (entityId) {
          // Show history graph in the same modal
          this.showEntityHistoryInModal(entityId, packNum, 'voltage');
        }
      });
    });
  }

  showPackStatus(packNum) {
    // Get status entities
    const statusSensors = [
      { id: 'system_status', label: 'System Status' },
      { id: 'protect_status', label: 'Protection Status' },
      { id: 'fault_status', label: 'Fault Status' },
      { id: 'alarm_status', label: 'Alarm Status' }
    ];

    const statuses = [];
    statusSensors.forEach(sensor => {
      const entityId = `${this.config.entity_prefix}_pack_${packNum}_${sensor.id}`;
      const state = this._hass.states[entityId];
      if (state && state.state !== 'unavailable') {
        statuses.push({
          label: sensor.label,
          value: state.state,
          isAlert: state.state !== 'Normal' && state.state !== 'normal'
        });
      }
    });

    if (statuses.length === 0) {
      return; // No status data available
    }

    // Build status grid HTML
    let statusHtml = '<div class="status-grid">';
    statuses.forEach(status => {
      const alertClass = status.isAlert ? 'alert' : '';
      statusHtml += `
        <div class="status-item ${alertClass}">
          <div class="status-label">${status.label}</div>
          <div class="status-value">${status.value}</div>
        </div>
      `;
    });
    statusHtml += '</div>';

    // Display modal
    const modalDiv = this.shadowRoot.getElementById('modal');
    modalDiv.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">Pack ${packNum} - Status</div>
            <button class="modal-close" id="closeModal">×</button>
          </div>
          ${statusHtml}
        </div>
      </div>
    `;

    // Add close event listeners
    const closeBtn = this.shadowRoot.getElementById('closeModal');
    const overlay = this.shadowRoot.querySelector('.modal-overlay');

    closeBtn.addEventListener('click', () => {
      modalDiv.innerHTML = '';
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        modalDiv.innerHTML = '';
      }
    });
  }

  showEntityHistoryInModal(entityId, packNum, type) {
    const modalDiv = this.shadowRoot.getElementById('modal');
    const entity = this._hass.states[entityId];
    const entityName = entity?.attributes?.friendly_name || entityId;

    // Create history graph iframe pointing to Home Assistant history
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    modalDiv.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 90%; width: 800px;">
          <div class="modal-header">
            <button class="modal-back" id="backButton">← Back to Heatmap</button>
            <div class="modal-title">${entityName}</div>
            <button class="modal-close" id="closeModal">×</button>
          </div>
          <div class="history-graph-container">
            <div id="historyGraph" style="min-height: 300px; padding: 20px; text-align: center;">
              Loading history...
            </div>
          </div>
          <div class="history-controls">
            <button class="history-zoom" data-hours="1">1h</button>
            <button class="history-zoom" data-hours="3">3h</button>
            <button class="history-zoom" data-hours="6">6h</button>
            <button class="history-zoom" data-hours="12">12h</button>
            <button class="history-zoom" data-hours="24">24h</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = this.shadowRoot.getElementById('closeModal');
    const backBtn = this.shadowRoot.getElementById('backButton');
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    const zoomButtons = this.shadowRoot.querySelectorAll('.history-zoom');

    closeBtn.addEventListener('click', () => {
      modalDiv.innerHTML = '';
    });

    backBtn.addEventListener('click', () => {
      // Go back to the appropriate heatmap
      if (type === 'temperature') {
        this.showTemperatureHeatMap(packNum);
      } else {
        this.showVoltageHeatMap(packNum);
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        modalDiv.innerHTML = '';
      }
    });

    // Handle zoom buttons
    zoomButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const hours = parseInt(btn.getAttribute('data-hours'));
        this.loadHistoryGraph(entityId, hours);
      });
    });

    // Load initial 1 hour history
    this.loadHistoryGraph(entityId, 1);
  }

  loadHistoryGraph(entityId, hours) {
    const graphContainer = this.shadowRoot.getElementById('historyGraph');

    // Verify entity exists
    if (!this._hass.states[entityId]) {
      graphContainer.innerHTML = `<div style="padding: 40px; color: var(--error-color);">Entity not found: ${entityId}</div>`;
      return;
    }

    // Check if mini-graph-card is available
    if (!customElements.get('mini-graph-card')) {
      graphContainer.innerHTML = `
        <div style="padding: 40px; color: var(--error-color); text-align: center;">
          <div style="margin-bottom: 16px;">
            <strong>mini-graph-card not installed</strong>
          </div>
          <div style="font-size: 14px;">
            Please install mini-graph-card from HACS or download from:<br>
            <a href="https://github.com/kalkih/mini-graph-card" target="_blank" style="color: var(--primary-color);">
              https://github.com/kalkih/mini-graph-card
            </a>
          </div>
        </div>
      `;
      return;
    }

    // Create mini-graph-card element
    const card = document.createElement('mini-graph-card');

    // Configure the card
    const config = {
      entities: [entityId],
      hours_to_show: hours,
      points_per_hour: 60,
      line_width: 2,
      animate: true,
      show: {
        name: false,
        icon: false,
        state: true,
        graph: 'line'
      },
      color_thresholds: [
        { value: -1000, color: 'var(--primary-color)' }
      ]
    };

    // IMPORTANT: Set config BEFORE hass to avoid undefined entities error
    card.setConfig(config);
    card.hass = this._hass;

    // Clear container and add card
    graphContainer.innerHTML = '';
    graphContainer.appendChild(card);
  }


  showHistory(entityId) {
    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true,
    });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  formatTime(hours) {
    if (hours < 1) {
      // Less than 1 hour, show minutes
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else if (hours < 24) {
      // Less than 24 hours, show hours and minutes
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    } else {
      // 24 hours or more, show days and hours
      const days = Math.floor(hours / 24);
      const h = Math.round(hours % 24);
      return h > 0 ? `${days}d ${h}h` : `${days}d`;
    }
  }

  getCardSize() {
    return 3;
  }

  static getStubConfig() {
    return {
      entity_prefix: "sensor.sok_rack_1",
      title: "Battery System",
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
  description: 'Multi-pack battery system overview',
  preview: true,
  documentationURL: 'https://github.com/jtubb/pylontech-battery-card'
});

console.info(
  '%c  PYLONTECH-BATTERY-OVERVIEW  %c Version 1.0.0 ',
  'color: white; background: green; font-weight: 700;',
  'color: green; background: white; font-weight: 700;'
);
