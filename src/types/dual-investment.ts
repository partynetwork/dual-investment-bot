
export interface DualInvestmentAsset {
    investmentAsset: string
    targetAsset: string
    projectType: string
}

export interface DualInvestmentList {
    apr: string
    autoCompoundPlanList: string[]
    canPurchase: boolean
    duration: string
    id: string
    investmentAsset: string
    targetAsset: string
    maxDepositAmount: string
    minDepositAmount: string
    orderId: string
    settleTime: string
    strikePrice: string
    type: string
    underlying: string
}

export interface DualInvestmentResponse {
    data: {
        list: DualInvestmentList[]
    }
}