// Charts management module for Family Health Tracker
// Handles all chart creation and data visualization

class ChartsManager {
  constructor() {
    this.charts = new Map(); // Store chart instances for cleanup
  }

  createTrendChart(canvas, vitals, vitalType) {
    if (!canvas || !vitals || vitals.length === 0) return;

    // Destroy existing chart
    this.destroyChart(canvas);

    const ctx = canvas.getContext('2d');
    const config = VITAL_SIGNS_CONFIG[vitalType];
    
    let datasets = [];
    
    if (vitalType === 'blood_pressure') {
      // Create separate datasets for systolic and diastolic
      const systolicData = vitals.reverse().map(vital => ({
        x: new Date(vital.recorded_at),
        y: vital.systolic
      }));
      
      const diastolicData = vitals.map(vital => ({
        x: new Date(vital.recorded_at),
        y: vital.diastolic
      }));

      datasets = [
        {
          label: 'Systolic',
          data: systolicData,
          borderColor: CHART_CONFIG.colors.danger,
          backgroundColor: CHART_CONFIG.colors.danger.replace('0.8', '0.1'),
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Diastolic',
          data: diastolicData,
          borderColor: CHART_CONFIG.colors.primary,
          backgroundColor: CHART_CONFIG.colors.primary.replace('0.8', '0.1'),
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        }
      ];
    } else {
      // Single value vital signs
      const data = vitals.reverse().map(vital => ({
        x: new Date(vital.recorded_at),
        y: vital.value
      }));

      datasets = [{
        label: config.name,
        data: data,
        borderColor: CHART_CONFIG.colors.primary,
        backgroundColor: CHART_CONFIG.colors.primary.replace('0.8', '0.1'),
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }];
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        ...CHART_CONFIG.defaultOptions,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM DD'
              }
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: `${config.name} (${config.unit})`
            },
            beginAtZero: false
          }
        },
        plugins: {
          ...CHART_CONFIG.defaultOptions.plugins,
          tooltip: {
            callbacks: {
              title: (context) => {
                return new Date(context[0].parsed.x).toLocaleDateString();
              },
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y} ${config.unit}`;
              }
            }
          }
        }
      }
    });

    this.charts.set(canvas.id, chart);
  }

  createDetailedChart(canvas, vitals, vitalType) {
    if (!canvas || !vitals || vitals.length === 0) {
      this.showNoDataMessage(canvas);
      return;
    }

    // Destroy existing chart
    this.destroyChart(canvas);

    const ctx = canvas.getContext('2d');
    const config = VITAL_SIGNS_CONFIG[vitalType];
    
    // Add reference ranges as background
    const referenceRanges = this.getReferenceRanges(vitalType);
    
    let datasets = [];
    
    if (vitalType === 'blood_pressure') {
      const systolicData = vitals.reverse().map(vital => ({
        x: new Date(vital.recorded_at),
        y: vital.systolic
      }));
      
      const diastolicData = vitals.map(vital => ({
        x: new Date(vital.recorded_at),
        y: vital.diastolic
      }));

      datasets = [
        {
          label: 'Systolic',
          data: systolicData,
          borderColor: CHART_CONFIG.colors.danger,
          backgroundColor: CHART_CONFIG.colors.danger.replace('0.8', '0.1'),
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Diastolic',
          data: diastolicData,
          borderColor: CHART_CONFIG.colors.primary,
          backgroundColor: CHART_CONFIG.colors.primary.replace('0.8', '0.1'),
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4,
        }
      ];

      // Add reference range bands
      if (referenceRanges.systolic) {
        datasets.push({
          label: 'Normal Systolic Range',
          data: [
            { x: systolicData[0]?.x, y: referenceRanges.systolic.normal[0] },
            { x: systolicData[systolicData.length - 1]?.x, y: referenceRanges.systolic.normal[0] }
          ],
          borderColor: 'rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 1,
          fill: '+1',
          pointRadius: 0,
          tension: 0,
        });
        
        datasets.push({
          label: 'Normal Systolic Upper',
          data: [
            { x: systolicData[0]?.x, y: referenceRanges.systolic.normal[1] },
            { x: systolicData[systolicData.length - 1]?.x, y: referenceRanges.systolic.normal[1] }
          ],
          borderColor: 'rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          tension: 0,
        });
      }
    } else {
      const data = vitals.reverse().map(vital => ({
        x: new Date(vital.recorded_at),
        y: vital.value
      }));

      datasets = [{
        label: config.name,
        data: data,
        borderColor: CHART_CONFIG.colors.primary,
        backgroundColor: CHART_CONFIG.colors.primary.replace('0.8', '0.1'),
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
      }];

      // Add reference range if available
      if (referenceRanges.normal) {
        datasets.push({
          label: 'Normal Range (Lower)',
          data: [
            { x: data[0]?.x, y: referenceRanges.normal[0] },
            { x: data[data.length - 1]?.x, y: referenceRanges.normal[0] }
          ],
          borderColor: 'rgba(16, 185, 129, 0.5)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 1,
          fill: '+1',
          pointRadius: 0,
          tension: 0,
        });
        
        datasets.push({
          label: 'Normal Range (Upper)',
          data: [
            { x: data[0]?.x, y: referenceRanges.normal[1] },
            { x: data[data.length - 1]?.x, y: referenceRanges.normal[1] }
          ],
          borderColor: 'rgba(16, 185, 129, 0.5)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          tension: 0,
        });
      }
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM DD',
                week: 'MMM DD',
                month: 'MMM YYYY'
              }
            },
            title: {
              display: true,
              text: 'Date',
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            title: {
              display: true,
              text: `${config.name} (${config.unit})`,
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              filter: (legendItem) => {
                // Hide reference range lines from legend
                return !legendItem.text.includes('Range');
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              title: (context) => {
                return new Date(context[0].parsed.x).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              },
              label: (context) => {
                if (context.dataset.label.includes('Range')) return null;
                return `${context.dataset.label}: ${context.parsed.y} ${config.unit}`;
              },
              afterBody: (context) => {
                // Add status information
                const value = context[0].parsed.y;
                if (vitalType === 'blood_pressure') {
                  // Would need both systolic and diastolic for proper status
                  return '';
                } else {
                  const status = this.getVitalStatus(vitalType, value);
                  return `Status: ${status.text}`;
                }
              }
            }
          }
        }
      }
    });

    this.charts.set(canvas.id, chart);
  }

  getReferenceRanges(vitalType) {
    const config = VITAL_SIGNS_CONFIG[vitalType];
    if (!config || !config.ranges) return {};

    const ranges = config.ranges;
    
    switch (vitalType) {
      case 'blood_pressure':
        return {
          systolic: {
            normal: ranges.normal.systolic,
            elevated: ranges.elevated.systolic,
            stage1: ranges.stage1.systolic,
            stage2: ranges.stage2.systolic
          },
          diastolic: {
            normal: ranges.normal.diastolic,
            stage1: ranges.stage1.diastolic,
            stage2: ranges.stage2.diastolic
          }
        };
      
      case 'heart_rate':
        return { normal: ranges.normal };
      
      case 'glucose':
        return { 
          normal: ranges.normal,
          prediabetes: ranges.prediabetes,
          diabetes: [ranges.diabetes[0], 300] // Cap at reasonable upper limit
        };
      
      case 'temperature':
        return { normal: ranges.normal };
      
      case 'oxygen':
        return { normal: ranges.normal };
      
      default:
        return {};
    }
  }

  getVitalStatus(vitalType, value) {
    // This would use the same logic as in vitals.js
    // Simplified version for chart tooltips
    const config = VITAL_SIGNS_CONFIG[vitalType];
    if (!config || !config.ranges) {
      return { text: 'Unknown', level: 'normal' };
    }

    // Basic implementation - would be expanded based on vital type
    return { text: 'Normal', level: 'normal' };
  }

  showNoDataMessage(canvas) {
    this.destroyChart(canvas);
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'No data available for the selected time range',
      canvas.width / 2,
      canvas.height / 2
    );
  }

  destroyChart(canvas) {
    const existingChart = this.charts.get(canvas.id);
    if (existingChart) {
      existingChart.destroy();
      this.charts.delete(canvas.id);
    }
  }

  destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  // Utility method to create comparison charts
  createComparisonChart(canvas, data1, data2, labels) {
    if (!canvas) return;

    this.destroyChart(canvas);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current Period',
            data: data1,
            backgroundColor: CHART_CONFIG.colors.primary,
            borderColor: CHART_CONFIG.colors.primary.replace('0.8', '1'),
            borderWidth: 1
          },
          {
            label: 'Previous Period',
            data: data2,
            backgroundColor: CHART_CONFIG.colors.secondary,
            borderColor: CHART_CONFIG.colors.secondary.replace('0.8', '1'),
            borderWidth: 1
          }
        ]
      },
      options: {
        ...CHART_CONFIG.defaultOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Average Value'
            }
          }
        }
      }
    });

    this.charts.set(canvas.id, chart);
  }
}

// Export for use in other modules
window.ChartsManager = ChartsManager;
