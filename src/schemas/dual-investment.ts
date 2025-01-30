import {model, Schema} from 'mongoose';
import * as dayjs from 'dayjs';

export interface DualInvestmentInterface {
    id: string
    type: string
    targetPrice: string
    apr: number
    startAPR?: number
    duration: number
    investmentAsset: string
    targetAsset: string
    startDate?: Date
    settlementDate: Date
    lastAlertAt?: Date
    aprHistories?: {
        timestamp: Date
        apr: number
    }[]
    aprAlertThreshold?: number
    maxAPR?: number
}

const DualInvestmentSchema = new Schema<DualInvestmentInterface>({
    id: {type: String, required: true,},
    type: {type: String, required: true},
    targetPrice: String,
    investmentAsset: String,
    targetAsset: String,
    apr: Number,
    startAPR: Number,
    maxAPR: Number,
    aprHistories: [{
        _id: false,
        timestamp: {
            type: Date,
            default: Date.now
        },
        apr: Number,
    }],
    duration: Number,
    lastAlertAt: Date,
    startDate: {type: Date, required: true},
    settlementDate: {type: Date, required: true},
}, {timestamps: true, collection: 'dual-investments', versionKey: false});

DualInvestmentSchema.index({
    id: 1,
    apr: -1,
})
DualInvestmentSchema.index({
    id: 1,
    'aprHistories.apr': -1,
})
DualInvestmentSchema.index({
    settlementDate: 1,
}, {expireAfterSeconds: 3600 * 10})
// 3. Create a Model.
export const DualInvestment = model<DualInvestmentInterface>('DualInvestment', DualInvestmentSchema);


export const createUpdateDualInvestmentQueries = (dualInvestments: DualInvestmentInterface[]) => {
    return dualInvestments.map((asset) => {
        return {
            updateOne: {
                filter: {
                    id: asset.id
                },
                update: {
                    apr: asset.apr,
                    targetPrice: asset.targetPrice,
                    investmentAsset: asset.investmentAsset,
                    targetAsset: asset.targetAsset,
                    type: asset.type,
                    settlementDate: asset.settlementDate,
                    $setOnInsert: {
                        startDate: dayjs(asset.settlementDate).subtract(asset.duration, 'days').toDate(),
                        duration: asset.duration,
                        startAPR: asset.apr,
                        maxAPR: asset.apr,
                        aprHistories: [{
                            apr: asset.apr,
                            timestamp: new Date()
                        }]
                    }
                },
                upsert: true
            }
        }
    })
}
export const createUpdateMaxAPRQueries = (dualInvestments: DualInvestmentInterface[]) => {
    return dualInvestments.map((asset) => {
        return {
            updateOne: {
                filter: {
                    id: asset.id,
                    maxAPR: {
                        $lt: asset.apr
                    }
                },
                update: {
                    maxAPR: asset.apr,
                }
            }
        }
    })
}
export const createUpdateAPRChangeHistoryQueries = (dualInvestments: DualInvestmentInterface[]) => {
    return dualInvestments.map((asset) => {
        return {
            updateOne: {
                filter: {
                    id: asset.id,
                    'aprHistories.apr': {$ne: asset.apr}
                },
                update: {
                    $push: {
                        aprHistories: {
                            $each: [{
                                apr: asset.apr,
                                timestamp: new Date()
                            }],
                            $slice: -200
                        }
                    }
                }
            }
        }
    })
}
export const findDualInvestmentByIds = async (ids: string[]) => {
    return DualInvestment.find({
        id: {
            $in: ids
        }
    }).lean()
}