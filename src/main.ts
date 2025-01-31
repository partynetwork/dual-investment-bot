import 'dotenv/config';

import {InvestmentType} from "./constants";
import {analyzeDualInvestment, fetchDualInvestments} from "./libs/assets";
import type {Mongoose} from 'mongoose';
import {connect} from 'mongoose';
import * as _ from 'radash';
import {
    createUpdateAPRChangeHistoryQueries,
    createUpdateDualInvestmentQueries,
    createUpdateMaxAPRQueries,
    DualInvestment,
    findDualInvestmentByIds
} from "./schemas/dual-investment";


const dualAssets = process.env?.DUAL_ASSETS || ''
const iterationInterval = Number(process.env?.ITERATION_INTERVAL) || 1000
const mongodbUri = process.env?.MONGODB_URI || ''

if (!dualAssets) {
    throw new Error('DUAL_ASSETS is required')
}
if (!mongodbUri) {
    throw new Error('MONGODB_URI is required')
}
const store = {
    id: null,
    dualAssets: dualAssets.split('/').map((asset) => asset.toUpperCase())
}
if (store.dualAssets.length !== 2) {
    throw new Error('DUAL_ASSETS must have 2 assets')
}

async function iterate() {
    const pairs = [
        store.dualAssets.at(0) || '',
        store.dualAssets.at(1) || ''
    ]
    const [
        sellHighInvestments,
        buyLowInvestments
    ] = await Promise.all([
        fetchDualInvestments({
            investmentAsset: pairs[0],
            targetAsset: store.dualAssets[1],
            projectType: InvestmentType.SellHigh
        }),
        fetchDualInvestments({
            investmentAsset: store.dualAssets[1],
            targetAsset: store.dualAssets[0],
            projectType: InvestmentType.BuyLow
        })
    ])
    let dualInvestments = []
    const groupedDualInvestments = _.group([
        ...sellHighInvestments,
        ...buyLowInvestments
    ], i => `${i.duration}:${i.type}`)
    for (const [_, investments] of Object.entries(groupedDualInvestments)) {
        if (!investments?.length) {
            continue
        }
        const topAPR = investments.sort((a, b) => {
            return b.apr - a.apr
        }).at(0)
        if (!topAPR) {
            continue
        }
        dualInvestments.push(topAPR)
    }
    if (dualInvestments.length === 0) {
        return
    }
    const updateQueries = createUpdateDualInvestmentQueries(dualInvestments)
    const updateMaxAPRQueries = createUpdateMaxAPRQueries(dualInvestments)
    const updateAPRChangeHistoryQueries = createUpdateAPRChangeHistoryQueries(dualInvestments)
    await DualInvestment.bulkWrite(updateQueries)
    await DualInvestment.bulkWrite([
        ...updateMaxAPRQueries,
        ...updateAPRChangeHistoryQueries
    ])
    const dualInvestmentIds = dualInvestments.map((i) => i.id)
    const results = await findDualInvestmentByIds(dualInvestmentIds)
    results.forEach((result) => {
        analyzeDualInvestment(result)
    })
}

let mongoose: Mongoose;

setInterval(() => {
    if (!mongoose) {
        return
    }
    iterate()
}, iterationInterval)


async function run() {
    mongoose = await connect(mongodbUri);
}

run()
