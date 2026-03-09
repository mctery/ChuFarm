/**
 * Recommendation rules per farm type.
 * Each rule: { sensor_type, condition, threshold, severity, message_th }
 */
const RECOMMENDATION_RULES = {
  default: [
    { sensor_type: 'soil', condition: 'lt', threshold: 30, severity: 'warning', message_th: 'ดินแห้งเกินไป ควรรดน้ำ' },
    { sensor_type: 'soil', condition: 'gt', threshold: 85, severity: 'info', message_th: 'ดินชื้นมากเกินไป ควรลดการให้น้ำ' },
    { sensor_type: 'temperature', condition: 'gt', threshold: 38, severity: 'critical', message_th: 'อุณหภูมิสูงเกินไป ควรเปิดพัดลมหรือม่านบังแดด' },
    { sensor_type: 'temperature', condition: 'lt', threshold: 10, severity: 'warning', message_th: 'อุณหภูมิต่ำเกินไป ควรเปิดระบบทำความร้อน' },
    { sensor_type: 'humidity', condition: 'gt', threshold: 85, severity: 'warning', message_th: 'ความชื้นสูงเกินไป เสี่ยงโรคเชื้อรา ควรเพิ่มการระบายอากาศ' },
    { sensor_type: 'humidity', condition: 'lt', threshold: 30, severity: 'info', message_th: 'ความชื้นต่ำเกินไป ควรเปิดระบบพ่นหมอก' },
    { sensor_type: 'light', condition: 'lt', threshold: 200, severity: 'info', message_th: 'แสงน้อยเกินไป ตรวจสอบม่านบังแดดหรือเปิดไฟเสริม' },
    { sensor_type: 'light', condition: 'gt', threshold: 80000, severity: 'info', message_th: 'แสงแดดจัดเกินไป ควรปิดม่านบังแดด' },
  ],
  greenhouse: [
    { sensor_type: 'temperature', condition: 'gt', threshold: 35, severity: 'critical', message_th: 'อุณหภูมิในโรงเรือนสูง ควรเปิดพัดลมระบายอากาศ' },
    { sensor_type: 'humidity', condition: 'gt', threshold: 80, severity: 'warning', message_th: 'ความชื้นในโรงเรือนสูง เสี่ยงโรคเชื้อรา' },
    { sensor_type: 'soil', condition: 'lt', threshold: 25, severity: 'warning', message_th: 'ดินในโรงเรือนแห้ง ควรรดน้ำ' },
  ],
  hydroponic: [
    { sensor_type: 'temperature', condition: 'gt', threshold: 32, severity: 'warning', message_th: 'อุณหภูมิน้ำสูง อาจทำให้รากเน่า' },
    { sensor_type: 'humidity', condition: 'lt', threshold: 40, severity: 'info', message_th: 'ความชื้นต่ำ ควรเพิ่มการพ่นหมอก' },
  ],
};

/**
 * Get recommendations based on latest sensor values.
 * @param {Array} sensorSummaries - Array of { sensor_type, avg, min, max }
 * @param {string} farmType - Farm type (greenhouse, openfield, etc.)
 * @returns {Array} recommendations
 */
function getRecommendations(sensorSummaries, farmType = 'default') {
  const rules = [
    ...(RECOMMENDATION_RULES[farmType] || []),
    ...RECOMMENDATION_RULES.default,
  ];

  // Deduplicate by sensor_type + condition + threshold
  const seen = new Set();
  const uniqueRules = rules.filter((r) => {
    const key = `${r.sensor_type}:${r.condition}:${r.threshold}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const recommendations = [];

  for (const summary of sensorSummaries) {
    const matchingRules = uniqueRules.filter((r) => r.sensor_type === summary.sensor_type);

    for (const rule of matchingRules) {
      let triggered = false;
      const checkValue = summary.avg;

      switch (rule.condition) {
        case 'gt': triggered = checkValue > rule.threshold; break;
        case 'gte': triggered = checkValue >= rule.threshold; break;
        case 'lt': triggered = checkValue < rule.threshold; break;
        case 'lte': triggered = checkValue <= rule.threshold; break;
      }

      if (triggered) {
        recommendations.push({
          sensor_type: rule.sensor_type,
          severity: rule.severity,
          message: rule.message_th,
          current_value: Math.round(checkValue * 100) / 100,
          threshold: rule.threshold,
          condition: rule.condition,
        });
      }
    }
  }

  // Sort by severity: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return recommendations;
}

module.exports = { getRecommendations, RECOMMENDATION_RULES };
