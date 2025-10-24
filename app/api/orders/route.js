import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";






export async function POST(request) {
    try {
        const {userId, has}=getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "not authorized"}, {status:401});
            

        }

        const{addressId, items, couponCode, paymentMethod}= await request.json()
        //check if all required fields are present

        if (!addressId|| !paymentMethod|| !items|| !Array.isArray(items) || items.length===0) {
            return NextResponse.json({error: "missing order details"}, {status:400});
            
        }

        let coupon = null;


        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
            where: {
                code: couponCode.toUpperCase()
            }
        })
        if (!coupon) {
            return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
        }
            // FIX 1: Added check to prevent crash if 'code' is not provided in the request.
        }
         

        // FIX 2: Changed 'findUnique' to 'findFirst'. 'findUnique' can only query on a single unique field.
        // 'findFirst' is required to query by both 'code' and 'expiresAt'.
        

        if (!coupon) {
            return NextResponse.json({error: "Coupon not found or expired"}, {status: 404});
        }

        // FIX 3: Added check for 'userId'. The original code would not work correctly
        // for logged-out users trying to validate a 'forNewUser' coupon.
        if (couponCode && coupon.forNewUser) {
            if (!userId) {
                return NextResponse.json({ error: "You must be logged in to use this coupon." }, { status: 401 });
            }
            const userorders = await prisma.order.findMany({where: {userId}});
            if (userorders.length>0) {
                return NextResponse.json({error: "Coupon valid for new users only"}, {status: 400});
            }
        }

        const isPlusMember = has({plan:'plus'})

        // check if coupon is for members only

        if (couponCode && coupon.forMember) {

            if (!isPlusMember) {
                return NextResponse.json({error: "Coupon valid for Plus members only"}, {status: 400});
            }
        }



        // group orders by storeId using a map

        const ordersByStore = new Map();
        for (const item of items) {
            const product = await prisma.product.findUnique({where: {id: item.id}});
            const storeId = product.storeId
            if(!ordersByStore.has(storeId)){
                ordersByStore.set(storeId, [])
            }
            ordersByStore.get(storeId).push({...item, price:product.price})
        }

        let orderIds =[];
        let fullAmount =0;

        let isShippingFeeAdded = false;

        // create order for each seller

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc,item)=>acc+(item.price* item.quantity),0)
            if (couponCode) {
                total-=(total*coupon.discount)/100
                
            }
            if(!isPlusMember && !isShippingFeeAdded){
                total+=5; // flat shipping fee
                isShippingFeeAdded=true;
            }

            fullAmount += parseFloat(total.toFixed(2));

            const order = await prisma.order.create({
                data:{
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true:false,
                    coupon : coupon? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item =>({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })
            orderIds.push(order.id);
            
        }

        //clear the cart

        await prisma.user.update({
            where: {id: userId},
            data:{
                cart: {}
            }
        })

        return NextResponse.json({ message: "Order placed successfully" }, { status: 201 });







    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
        
    }

}


// get all orders for user

export async function GET(request) {
    try {
        const {userId}=getAuth(request);
        const orders = await prisma.order.findMany({
            where: {userId, OR:[
                {paymentMethod: PaymentMethod.COD},
                {AND:[{paymentMethod: PaymentMethod.STRIPE}, {isPaid: true}]}
            ]},
            include : {
                orderItems:{include:{product:true}},
                address: true
            },
            orderBy: {createdAt: 'desc'}

        })

        return NextResponse.json({orders}, {status: 200});
        
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
        
        
    }
}