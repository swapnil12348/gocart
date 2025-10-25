// add new rating

import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(request) {
    try {
        const {userId}=getAuth(request);
        const {orderId, productId, rating, review}= await request.json();
        const order = await prisma.order.findUnique({
            where: {id: orderId, userId}
        })

        if (!order) {
            return NextResponse.json({error: "Order not found"}, {status:404});
        }
        const isAlreadyRated = await prisma.rating.findFirst({
            where: { productId, orderId}
        })

        if (isAlreadyRated) {
            return NextResponse.json({error: "Product already rated for this order"}, {status:400});
        }
        const response = await prisma.rating.create({
            data: {
                userId,
                productId,
                rating,
                review,
                orderId
            }
        })

        return NextResponse.json({message: "Rating submitted successfully", rating: response}, {status:200});


    } catch (error) {
        console.error("API Error in /api/rating:", error);
        return NextResponse.json({error: error.code || error.message}, {status:400});
    }
}



// get all ratinf for user


export async function GET(request) {
    try {
        const {userId}=getAuth(request);
        if (!userId) {
            return NextResponse.json({error: "User not authenticated"}, {status:401});
        }
        const ratings = await prisma.rating.findMany({
            where: {userId}
        })

        return NextResponse.json({ratings}, {status:200});

    } catch (error) {
        console.error("API Error in /api/rating:", error);
        return NextResponse.json({error: error.code || error.message}, {status:400});
    }
}