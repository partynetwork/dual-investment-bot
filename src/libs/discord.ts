import * as _ from 'radash'
import {DualInvestmentInterface} from "../schemas/dual-investment";
import * as dayjs from "dayjs";
import axios from "axios";


const messageTemplate = `
Duration {{duration}} Days
Pair: {{investmentAsset}} for {{targetAsset}}
APR: {{apr}}%
Price: {{targetPrice}}
Settlement Date: <t:{{settlementDate}}:f>
=======================
`

const webhookURL = process.env.DISCORD_WEBHOOK_URL || ''
const avatarURL = process.env.DISCORD_PROFILE_LOGO_URL || ''

export const createContentMessage = (dualAsset: DualInvestmentInterface) => {

    return _.template(messageTemplate, {
        duration: dualAsset.duration + 1,
        apr: dualAsset.apr.toFixed(2),
        targetAsset: dualAsset.targetAsset,
        investmentAsset: dualAsset.investmentAsset,
        targetPrice: trimTrailingZeros(dualAsset.targetPrice),
        settlementDate: dayjs(dualAsset.settlementDate).toDate().getTime() /1000
    })
}

function trimTrailingZeros(value: number | string): string {
    // แปลงค่าเป็น String
    let strValue = typeof value === "number" ? value.toString() : value;

    // ใช้ regex เพื่อลบ 0 ท้ายสุดหลังจุดทศนิยม
    return strValue.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
}

export const pushMessage = async (dualAsset: DualInvestmentInterface) => {
    if (!webhookURL) {
        throw new Error('Webhook URL is not defined')
    }
    await axios.post(webhookURL, {
        "content": createContentMessage(dualAsset),
        "embeds": null,
        "username": dualAsset.type,
        "avatar_url": avatarURL,
        "attachments": []
    }).then(() => {
        console.log('Message sent')
    }).catch((error) => {
        console.error('Error sending message', error)
    })
}