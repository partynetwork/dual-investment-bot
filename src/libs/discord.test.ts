import {createContentMessage} from "./discord";

describe('Test message template', () => {
    it('should return the correct message', () => {
        const actual = createContentMessage({
            "id": "1511308",
            "apr": 196.45999999999998,
            "aprHistories": [
                {
                    "timestamp": new Date("2025-01-29T11:38:00.560+0000"),
                    "apr": 199.22
                },
                {
                    "timestamp": new Date("2025-01-29T11:38:27.603+0000"),
                    "apr": 203.92999999999998
                },
                {
                    "timestamp": new Date("2025-01-29T11:43:41.011+0000"),
                    "apr": 210.91000000000003
                }
            ],
            "duration": 2,
            "investmentAsset": "BTC",
            "maxAPR": 210.91000000000003,
            "settlementDate": new Date("2025-01-31T08:00:00.000+0000"),
            "startAPR": 193.01,
            "startDate": new Date("2025-01-29T08:00:00.000+0000"),
            "targetAsset": "USDT",
            "targetPrice": "103000.00000000",
            "type": "Sell High",
        })
        console.log('actual', actual)
    })
});