import {calculateStandardDeviation} from "./assets";

describe('Test Asset function', () => {
    it('calculateStandardDeviation', () => {
// ✅ ทดสอบฟังก์ชัน
        const aprValues = [163.68, 165.62, 167.62, 170.81];
        const stdDev = calculateStandardDeviation(aprValues);
        console.log("Standard Deviation:", stdDev.toFixed(2));
    })
});