import prisma from "@/lib/prisma";
import { Period, TimeFrame } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { getDaysInMonth, getYear } from "date-fns";
import { redirect } from "next/navigation";
import { z } from "zod";

const getHistoryDataSchema = z.object({
    timeFrame: z.enum(["month", "year"]),
    month: z.coerce.number().min(0).max(11).default(0),
    year: z.coerce.number().min(2000).max(3000),
})



export async function GET(req: Request) {
    const user = await currentUser();
    if (!user) {
        redirect("/sign-in");
    }

    const { searchParams } = new URL(req.url)
    const timeFrame = searchParams.get("timeFrame");
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    const queryParams = getHistoryDataSchema.safeParse({
        timeFrame,
        month,
        year
    });
    if (!queryParams.success) {
        return Response.json(queryParams.error.message, {
            status: 400
        })
    }
    const data = await getHistoryData(user.id, queryParams.data.timeFrame, {
        month: queryParams.data.month,
        year: queryParams.data.year
    })
    return Response.json(data)
}

export type GetHistoryDataResponseType = Awaited<ReturnType<typeof getHistoryData>>

type HistoryData = {
    expense: number,
    income: number,
    year: number,
    month: number,
    day?: number
}


async function getHistoryData(userId: string, timeFrame: TimeFrame, period: Period) {
    switch (timeFrame) {
        case "year":
            return await getYearHistoryData(userId, period.year)
        case "month":
            return await getMonthHistoryData(userId, period.year, period.month)
    }
}
async function getYearHistoryData(userId: string, year: number) {
    const result = await prisma.yearHistory.groupBy({
        by: ["month"], // it will not do anything as the data is already group by month
        where: {
            userId,
            year
        },
        _sum: {
            expense: true,
            income: true
        },
        orderBy: [{
            month: "asc"
        },
        ],

    });
    if (!result || result.length === 0) return [];

    // we want response in such a way that it shows all the months irrespective of their transaction ,so we will show month 0 -11  if no transaction they will be empty ---easy to apply in bar chart


    const history: HistoryData[] = [];
    for (let i = 0; i < 12; i++) {
        let expense = 0;
        let income = 0;
        const month = result.find(row => row.month === i)
        if (month) {
            expense = month._sum.expense || 0
            income = month._sum.income || 0
        }

        history.push({
            year,
            month: i,
            expense,
            income,

        })
    }
    return history;
}
async function getMonthHistoryData(userId: string, year: number, month: number) {
    const result = await prisma.monthHistory.groupBy({
        by: ["day"],
        where: {
            userId,
            year,
            month,
        },
        _sum: {
            expense: true,
            income: true
        },
        orderBy: [{
            day: "asc"
        },
        ],

    });
    if (!result || result.length === 0) return [];
    const daysInMonth = getDaysInMonth(new Date(year, month))

    const history: HistoryData[] = [];
    for (let i = 1; i < daysInMonth; i++) {
        let expense = 0;
        let income = 0;
        const day = result.find(row => row.day === i)
        if (day) {
            expense = day._sum.expense || 0
            income = day._sum.income || 0
        }

        history.push({
            year,
            month,
            expense,
            income,
            day: i

        })
    }
    return history;
}