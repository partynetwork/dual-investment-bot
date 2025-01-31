import {DualInvestmentAsset, DualInvestmentResponse} from "../types/dual-investment";
import axios from "axios";
import {BASE_URL, InvestmentType} from "../constants";
import {DualInvestmentInterface} from "../schemas/dual-investment";
import * as dayjs from "dayjs";
import {pushMessage} from "./discord";
import * as _ from "radash";

export const fetchDualInvestments = async (asset: DualInvestmentAsset): Promise<DualInvestmentInterface[]> => {
    const query = {
        investmentAsset: asset.investmentAsset,
        targetAsset: asset.targetAsset,
        projectType: asset.projectType,
        sortType: 'APY_DESC',
        endDuration: 7
    }
    const response = await axios.get<DualInvestmentResponse>(BASE_URL, {
        params: query
    });
    return (response?.data?.data?.list || [])
        .filter((i) => i.canPurchase)
        .map((invest) => {
            const apr = +invest.apr
            const type = invest.type === InvestmentType.SellHigh ? 'Sell High' : 'Buy Low'
            return {
                id: invest.id,
                investmentAsset: invest.investmentAsset,
                targetAsset: invest.targetAsset,
                type,
                targetPrice: invest.strikePrice,
                apr: apr * 100,
                duration: +invest.duration,
                settlementDate: new Date(+invest.settleTime)
            }
        })
};

export function calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    // คำนวณค่าเฉลี่ย (Mean)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    // คำนวณค่าความแปรปรวน (Variance)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    // ค่าเบี่ยงเบนมาตรฐาน (Standard Deviation)
    return Math.sqrt(variance);
}

const aprZScoreMultiplier = Number(process.env.APR_Z_SCORE_MULTIPLIER) || 2;

function getAlertThreshold(aprValues: number[]): number {
    const meanAPR = aprValues.reduce((sum, val) => sum + val, 0) / aprValues.length;
    const stdAPR = calculateStandardDeviation(aprValues);
    return meanAPR + (aprZScoreMultiplier * stdAPR);
}

export const getBestRateDualInvestments = (buyLowInvestments: DualInvestmentInterface[], sellHighInvestments: DualInvestmentInterface[]): DualInvestmentInterface[] => {
    let dualInvestments = []
    const groupedDualInvestments = _.group([
        ...sellHighInvestments,
        ...buyLowInvestments
    ], i => `${i.duration}:${i.type}`)
    for (const [_, investments] of Object.entries(groupedDualInvestments)) {
        if (!investments?.length) {
            continue
        }
        const topAPRs = investments.sort((a, b) => {
            return b.apr - a.apr
        }).slice(0, 2)
        dualInvestments.push(...topAPRs)
    }
    return dualInvestments
}
export const analyzeDualInvestment = (
    afterUpdateAsset: DualInvestmentInterface
): void => {
    if ((afterUpdateAsset?.aprHistories || [])?.length < 5) {
        return
    }
    const maxAPR = afterUpdateAsset.maxAPR
    if (!maxAPR) {
        return;
    }
    const maxAPRTimestamp = afterUpdateAsset.aprHistories?.at(-1)?.timestamp as Date
    const isNewHighAPR = afterUpdateAsset.apr == maxAPR && dayjs(maxAPRTimestamp).diff(new Date(), 'seconds') === 0
    if (isNewHighAPR) {
        const aprValues = (afterUpdateAsset.aprHistories || [])
            .map((i) => i.apr)
            .sort((a, b) => a - b)
            .filter((apr) => apr != maxAPR)
        const alertThreshold = getAlertThreshold(aprValues)
        // console.log(`[${afterUpdateAsset.id}]
        //  APR Threshold: ${alertThreshold}
        //  Asset: ${afterUpdateAsset.investmentAsset} has a high APR from ${aprValues.at(-1)} to ${maxAPR}`)
        if (afterUpdateAsset.apr >= alertThreshold) {
            // console.log(createContentMessage(afterUpdateAsset))
            pushMessage(afterUpdateAsset)
        }
    }
    // console.log('isNewHighAPR', isNewHighAPR)

    // const shouldAlert = afterUpdateAsset.apr >= getAlertThreshold(afterUpdateAsset.aprHistories?.at(-2)?.apr)
    //     || afterUpdateAsset.apr >= maxAPR
    // if (shouldAlert) {
    //     console.log(`[${afterUpdateAsset.id}] Alert: ${afterUpdateAsset.investmentAsset} has a high APR from ${afterUpdateAsset.aprHistories?.at(-2)?.apr} to ${maxAPR}`)
    // }
}